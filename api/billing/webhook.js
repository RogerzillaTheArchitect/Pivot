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
const { renderTemplate } = require('../_lib/emailTemplates');

module.exports.config = { api: { bodyParser: false } };

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

  /* Template real "Generic Account Notification" (email-templates-v2/06-...)
     — mesmo motor de api/emails/send-event.js, nunca um HTML próprio aqui. */
  async function notificarAssinatura(email, plano, ativa) {
    if (!email || !process.env.RESEND_API_KEY) return;
    try {
      const titulo = ativa ? 'Sua assinatura está ativa' : 'Sua assinatura foi cancelada';
      const html = renderTemplate('accountNotification', {
        __blocks: { CTA_BLOCK: !!process.env.APP_URL },
        EVENT_TITLE: titulo,
        EVENT_DESCRIPTION: ativa
          ? 'Obrigado por assinar o Pivots. Seu plano ' + (plano || 'Pivots') + ' já está ativo e pronto para usar.'
          : 'Confirmamos o cancelamento da sua assinatura. Você continuará com acesso até o fim do período já pago.',
        EVENT_TIME: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        USER_EMAIL: email,
        ACTION_URL: (process.env.APP_URL || 'https://pivots.app') + '/?view=configuracoes',
        ACTION_CTA_LABEL: 'Ver assinatura',
        PREHEADER: titulo,
      });
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          reply_to: process.env.RESEND_REPLY_TO || 'contact@pivots.app',
          subject: titulo,
          html
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
