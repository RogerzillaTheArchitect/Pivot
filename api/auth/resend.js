/**
 * POST /api/auth/resend
 * Body: { email }
 *
 * Reenvia a confirmação de conta pelo Resend. Usa type='magiclink' em vez de
 * 'signup' — funciona mesmo que a conta já exista mas ainda não esteja
 * confirmada (gerar outro link 'signup' para o mesmo email dá erro "already
 * registered"), e o próprio ato de seguir o link confirma o email na mesma.
 */

const AVATAR_COLORS = ['#B23A1E', '#5C4A1E', '#1F6E66', '#A8631A', '#B8466E', '#4C7A3D'];
function corAvatar(nome) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function iniciais(nome) {
  const partes = (nome || '?').trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return (nome || '?').slice(0, 2).toUpperCase();
}
function escaparHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Mesmo sistema visual partilhado com os emails da app (ver emailShellHtml em
// index.html) e com api/team/invite.js: logo do Pivots sempre no cabeçalho
// verde, avatar da pessoa a sobrepor a fronteira, botão em pílula, rodapé.
const EMAIL_LOGO_URL = 'https://pivots.app/email/logo-square.png';
const EMAIL_CREME = '#F3F1EA', EMAIL_VERDE = '#15532D',
  EMAIL_CINZA = '#6B6459', EMAIL_TINTA = '#161614';

function construirEmailVerificacaoHtml(actionLink, nome) {
  const avatarCor = corAvatar(nome || 'Pivots');
  const avatarLetras = iniciais(nome || 'Pivots');
  const saudacao = nome ? 'Olá, ' + escaparHtml(nome) + '.' : 'Olá.';
  return '<table role="presentation" width="100%" style="background:' + EMAIL_CREME + ';border-collapse:collapse"><tr><td style="padding:32px 16px">' +
    '<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;border-collapse:collapse">' +
      '<tr><td style="text-align:center;padding-bottom:20px;font-family:Arial,sans-serif"><span style="font-size:19px;font-weight:800;letter-spacing:.05em;color:' + EMAIL_VERDE + '">PIVOTS</span></td></tr>' +
      '<tr><td><table role="presentation" width="100%" style="border-collapse:collapse;background:#fff;border-radius:18px;overflow:hidden">' +
        '<tr><td style="background:' + EMAIL_VERDE + ';padding:26px 24px 40px;text-align:center"><img src="' + EMAIL_LOGO_URL + '" width="72" height="72" style="border-radius:16px;background:#fff;display:inline-block" alt="Pivots"></td></tr>' +
        '<tr><td style="background:' + EMAIL_VERDE + ';padding:0;text-align:center;line-height:0;font-size:0">' +
          '<table role="presentation" align="center" style="margin:0 auto -34px"><tr><td style="width:68px;height:68px;border-radius:50%;background:' + avatarCor + ';border:4px solid #fff;text-align:center;vertical-align:middle;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#fff">' + escaparHtml(avatarLetras) + '</td></tr></table>' +
        '</td></tr>' +
        '<tr><td style="padding:34px 28px 4px;text-align:center">' +
          '<h2 style="font-size:20px;font-weight:800;margin:0 0 10px;color:' + EMAIL_TINTA + ';font-family:Arial,sans-serif;line-height:1.32">Confirme o seu email para continuar</h2>' +
          '<p style="font-size:13.5px;color:' + EMAIL_CINZA + ';margin:0 0 4px;line-height:1.6;font-family:Arial,sans-serif">' + saudacao + ' A sua conta no Pivots está quase pronta, falta só confirmar que este é mesmo o seu email.</p>' +
        '</td></tr>' +
        '<tr><td style="padding:16px 32px 4px"><a href="' + actionLink + '" style="display:block;text-align:center;background:' + EMAIL_VERDE + ';color:#fff;font-weight:700;font-size:14.5px;padding:15px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif">Confirmar o meu email</a></td></tr>' +
        '<tr><td style="padding:0 26px 4px;text-align:center;font-family:Arial,sans-serif;font-size:11.5px;color:' + EMAIL_CINZA + '">Se não foi você quem criou esta conta, pode ignorar esta mensagem com segurança.</td></tr>' +
        '<tr><td style="height:22px;line-height:22px;font-size:1px">&nbsp;</td></tr>' +
      '</table></td></tr>' +
      '<tr><td style="padding:22px 20px 0;text-align:center;font-family:Arial,sans-serif;font-size:11px;color:' + EMAIL_CINZA + ';line-height:1.7">Pivots &copy; ' + new Date().getFullYear() + ' &nbsp;&middot;&nbsp; Todos os direitos reservados<br>Este é um email automático de confirmação de conta, não é necessário responder.</td></tr>' +
    '</table>' +
  '</td></tr></table>';
}

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
            subject: 'Confirme o seu email para ativar a conta Pivots',
            html: construirEmailVerificacaoHtml(actionLink, nome)
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
