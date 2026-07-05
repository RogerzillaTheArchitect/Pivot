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

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await atualizarPlano(session.metadata && session.metadata.workspace_id, session.metadata && session.metadata.plano);
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await atualizarPlano(subscription.metadata && subscription.metadata.workspace_id, 'Free');
    }
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar webhook.', details: String(err && err.message || err) });
  }
};
