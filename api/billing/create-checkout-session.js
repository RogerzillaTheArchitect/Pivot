/**
 * POST /api/billing/create-checkout-session
 * Body: { access_token, workspace_id, plano }
 *
 * Cria uma sessão de checkout da Stripe para o plano escolhido (Plus/Pro/Business)
 * e devolve o URL para onde o frontend deve redirecionar o utilizador.
 * Usa fetch nativo contra a API REST da Stripe — sem adicionar a biblioteca "stripe".
 */
const PRICE_IDS = {
  Plus: 'price_1TpijMLFy6RH2omP72dNZXC1',
  Pro: 'price_1TpijMLFy6RH2omP910LmdJD',
  Business: 'price_1TpijNLFy6RH2omP89oud6C9'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }
  const { access_token, workspace_id, plano } = req.body || {};
  const priceId = PRICE_IDS[plano];
  if (!access_token || !workspace_id || !priceId) {
    res.status(400).json({ error: 'access_token, workspace_id e um plano válido (Plus, Pro ou Business) são obrigatórios.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const APP_URL = process.env.APP_URL || 'https://pivots.app';

  try {
    const userResp = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + access_token }
    });
    if (!userResp.ok) {
      const detalhe = await userResp.text().catch(() => '');
      res.status(401).json({ error: 'Sessão inválida.', debug_status: userResp.status, debug_body: detalhe, debug_has_url: !!SUPABASE_URL, debug_has_key: !!SERVICE_KEY });
      return;
    }
    const user = await userResp.json();

    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: APP_URL + '/?checkout=success',
      cancel_url: APP_URL + '/?checkout=cancel',
      client_reference_id: workspace_id,
      customer_email: user.email,
      'metadata[workspace_id]': workspace_id,
      'metadata[plano]': plano,
      'subscription_data[metadata][workspace_id]': workspace_id,
      'subscription_data[metadata][plano]': plano
    });

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(STRIPE_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const session = await r.json();
    if (!r.ok) {
      res.status(500).json({ error: (session.error && session.error.message) || 'Erro ao criar checkout.' });
      return;
    }
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado.', details: String(err && err.message || err) });
  }
};
