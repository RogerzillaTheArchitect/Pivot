/**
 * POST /api/auth/signup
 * Body: { email, password, nome }
 *
 * Cria a conta e envia o email de confirmação nós mesmos pelo Resend, em vez
 * de depender do SMTP embutido da Supabase (só funciona com SMTP personalizado
 * configurado no projeto — o mesmo problema já resolvido para os convites de
 * equipa em api/team/invite.js). Usa a mesma abordagem: admin API gera o link
 * de confirmação, nós enviamos o email com a marca Pivots — template real
 * "Email Verification" (email-templates-v2/02-...), variante de magic link
 * (sem bloco de código, já que este fluxo nunca usa código de 6 dígitos).
 */
const { renderTemplate } = require('../_lib/emailTemplates');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }

  const { email, password, nome } = req.body || {};
  if (!email || !password || !nome) {
    res.status(400).json({ error: 'email, password e nome são obrigatórios.' });
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
    // type='signup' cria a conta (com a password já definida) e devolve um link
    // de confirmação — não envia nada sozinho, enviamos nós pelo Resend a seguir.
    const linkResp = await sbFetch('/auth/v1/admin/generate_link', {
      method: 'POST',
      body: JSON.stringify({
        type: 'signup',
        email,
        password,
        options: { data: { nome }, redirect_to: APP_URL }
      })
    });

    if (!linkResp.ok) {
      const msg = (linkResp.body && (linkResp.body.msg || linkResp.body.message || linkResp.body.error_description)) || '';
      if (/already|registered|exists/i.test(msg)) {
        res.status(409).json({ error: 'Já existe uma conta com este email.' });
        return;
      }
      res.status(500).json({ error: msg || 'Erro ao criar a conta.' });
      return;
    }

    const lb = linkResp.body || {};
    const actionLink = lb.action_link || (lb.properties && lb.properties.action_link);
    const userId = (lb.user && lb.user.id) || lb.id || lb.user_id;
    if (!userId || !actionLink) {
      res.status(500).json({ error: 'Não foi possível gerar a confirmação da conta.' });
      return;
    }

    let emailEnviado = false;
    if (RESEND_KEY && FROM_EMAIL) {
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

    res.status(200).json({ ok: true, userId, emailEnviado });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado ao criar a conta.', details: String(err && err.message || err) });
  }
};
