/**
 * POST /api/auth/resend
 * Body: { email }
 *
 * Reenvia a confirmação de conta pelo Resend. Usa type='magiclink' em vez de
 * 'signup' — funciona mesmo que a conta já exista mas ainda não esteja
 * confirmada (gerar outro link 'signup' para o mesmo email dá erro "already
 * registered"), e o próprio ato de seguir o link confirma o email na mesma.
 * Mesmo template real "Email Verification" usado em api/auth/signup.js.
 */
const { renderTemplate } = require('../_lib/emailTemplates');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }
  const { email } = req.body || {};
  if (!email) {
    res.status(400).json({ error: 'email é obrigatório.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const APP_URL = process.env.APP_URL || 'https://pivots.app';
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

  async function sbFetch(path, opts = {}) {
    const r = await fetch(SUPABASE_URL + path, {
      ...opts,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      }
    });
    return { ok: r.ok, status: r.status, body: r.status === 204 ? null : await r.json().catch(() => ({})) };
  }

  try {
    const linkResp = await sbFetch('/auth/v1/admin/generate_link', {
      method: 'POST',
      body: JSON.stringify({ type: 'magiclink', email, options: { redirect_to: APP_URL } })
    });
    if (!linkResp.ok) {
      res.status(500).json({ error: 'Não foi possível reenviar a confirmação.' });
      return;
    }
    const lb = linkResp.body || {};
    const actionLink = lb.action_link || (lb.properties && lb.properties.action_link);
    const nome = lb.user && lb.user.user_metadata && lb.user.user_metadata.nome;
    let emailEnviado = false;
    if (RESEND_KEY && FROM_EMAIL && actionLink) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            reply_to: process.env.RESEND_REPLY_TO || 'contact@pivots.app',
            subject: 'Confirme seu e-mail para ativar sua conta Pivots',
            html: renderTemplate('emailVerification', {
              __blocks: { ACCESS_CODE_ROW: false },
              USER_NAME: nome || '',
              VERIFY_INSTRUCTION: 'Clique no botão abaixo para confirmar seu e-mail e ativar sua conta Pivots.',
              EXPIRES_IN: '24 horas',
              ACTION_URL: actionLink,
              PREHEADER: 'Confirme seu e-mail para ativar sua conta Pivots.',
            })
          })
        });
        emailEnviado = r.ok;
      } catch (e) { emailEnviado = false; }
    }
    res.status(200).json({ ok: true, emailEnviado });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado ao reenviar.', details: String(err && err.message || err) });
  }
};
