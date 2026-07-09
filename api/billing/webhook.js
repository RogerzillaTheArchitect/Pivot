/**
 * POST /api/billing/webhook
 * Configurar no Stripe: Developers > Webhooks > Add endpoint
 *   URL: https://pivots.app/api/billing/webhook
 *   Eventos: checkout.session.completed, customer.subscription.deleted
 *
 * Atualiza perfilData.plano na conta automaticamente quando o pagamento é
 * confirmado ou a subscrição é cancelada. Verifica a assinatura Stripe com
 * crypto nativo do Node — sem adicionar a biblioteca "stripe".
 */
const crypto = require('crypto');

module.exports.config = { api: { bodyParser: false } };

/* Email de confirmação/cancelamento de assinatura — versão mínima, server-side,
   sem depender do bundle do frontend (que só existe no browser). Reaproveita
   a mesma paleta dos templates de email do Pivot (ver construirEmailContaInline
   em index.html), mas escrita à parte porque este ficheiro corre no Node do
   Vercel, isolado do JS da app. */
function construirEmailAssinaturaHtml(plano, ativa) {
  const VERDE = '#15532D', VERDE_CLARO = '#EAF3EC', CINZA = '#6B6459', LINHA = '#E7E2D6';
  const badge = ativa ? 'Assinatura ativa' : 'Assinatura cancelada';
  const titulo = ativa ? 'A sua assinatura está ativa' : 'A sua assinatura foi cancelada';
  const corpo = ativa
    ? 'Obrigado por assinar o Pivot. O seu plano ' + plano + ' já está ativo e pronto a usar.'
    : 'Confirmamos o cancelamento da sua assinatura. Vai continuar a ter acesso até ao fim do período já pago.';
  return '<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid ' + LINHA + ';border-radius:16px;overflow:hidden;font-family:Arial,sans-serif">' +
    '<tr><td style="padding:28px 24px;text-align:center;background:' + VERDE + '"><div style="color:#fff;font-size:19px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Pivot</div></td></tr>' +
    '<tr><td style="padding:22px 24px 26px">' +
      '<span style="display:inline-block;background:' + VERDE_CLARO + ';color:' + VERDE + ';font-size:11px;font-weight:700;padding:5px 11px;border-radius:20px">' + badge + '</span>' +
      '<h2 style="font-size:20px;font-weight:700;margin:12px 0 8px;color:#111">' + titulo + '</h2>' +
      '<p style="font-size:13px;color:' + CINZA + ';margin:0">' + corpo + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:14px 24px;border-top:1px solid ' + LINHA + ';text-align:center;font-size:11px;color:' + CINZA + '">Pivot &nbsp;·&nbsp; Este é um email automático — não é necessário responder.</td></tr>' +
    '</table>';
}

function lerCorpoCru(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    req.on('data', c => partes.push(c));
    req.on('end', () => resolve(Buffer.concat(partes)));
    req.on('error', reject);
  });
}

function assinaturaValida(payloadTexto, header, secret) {
  if (!header) return false;
  const partes = Object.fromEntries(header.split(',').map(p => p.split('=')));
  if (!partes.t || !partes.v1) return false;
  const esperado = crypto.createHmac('sha256', secret).update(partes.t + '.' + payloadTexto).digest('hex');
  return esperado === partes.v1;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const cru = await lerCorpoCru(req);
  const payloadTexto = cru.toString('utf8');
  const assinatura = req.headers['stripe-signature'];

  if (!assinaturaValida(payloadTexto, assinatura, process.env.STRIPE_WEBHOOK_SECRET)) {
    res.status(400).json({ error: 'Assinatura Stripe inválida.' });
    return;
  }

  const event = JSON.parse(payloadTexto);
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  async function atualizarPlano(workspaceId, plano) {
    if (!workspaceId) return;
    const atual = await fetch(
      SUPABASE_URL + '/rest/v1/kv_store?workspace_id=eq.' + workspaceId + '&key=eq.pivot-perfilData',
      { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
    ).then(r => r.json());
    const perfil = (atual[0] && atual[0].value) || {};
    perfil.plano = plano;
    await fetch(SUPABASE_URL + '/rest/v1/kv_store', {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ workspace_id: workspaceId, key: 'pivot-perfilData', value: perfil, updated_at: new Date().toISOString() })
    });
  }

  /* email do Admin do workspace — usado quando o próprio evento Stripe não
     traz o email (caso de customer.subscription.deleted) */
  async function emailDoAdminWorkspace(workspaceId) {
    if (!workspaceId) return null;
    const membros = await fetch(
      SUPABASE_URL + '/rest/v1/workspace_members?workspace_id=eq.' + workspaceId + '&papel=eq.Admin&select=user_id&limit=1',
      { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
    ).then(r => r.json()).catch(() => null);
    const ownerId = membros && membros[0] && membros[0].user_id;
    if (!ownerId) return null;
    const r = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + ownerId, {
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY }
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data && data.email;
  }

  async function notificarAssinatura(email, plano, ativa) {
    if (!email || !process.env.RESEND_API_KEY) return;
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: ativa ? 'A sua assinatura está ativa' : 'A sua assinatura foi cancelada',
          html: construirEmailAssinaturaHtml(plano || 'Pivot', ativa)
        })
      });
    } catch (e) { /* falha de envio não deve travar a atualização do plano */ }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const workspaceId = session.metadata && session.metadata.workspace_id;
      const plano = session.metadata && session.metadata.plano;
      await atualizarPlano(workspaceId, plano);
      const email = session.customer_details && session.customer_details.email;
      await notificarAssinatura(email, plano, true);
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const workspaceId = subscription.metadata && subscription.metadata.workspace_id;
      await atualizarPlano(workspaceId, 'Free');
      const email = await emailDoAdminWorkspace(workspaceId);
      await notificarAssinatura(email, subscription.metadata && subscription.metadata.plano, false);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar webhook.', details: String(err && err.message || err) });
  }
};
