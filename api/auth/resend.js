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
function construirEmailVerificacaoHtml(actionLink, nome) {
  const VERDE = '#15532D', VERDE_CLARO = '#EAF3EC', CINZA = '#6B6459', LINHA = '#E7E2D6', PAPEL_FUNDO = '#FAF9F6';
  const avatarCor = corAvatar(nome || 'P');
  const avatarLetras = iniciais(nome || 'Pivot');
  const saudacao = nome ? 'Olá, ' + escaparHtml(nome) + '.' : 'Olá.';
  return '<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid ' + LINHA + ';border-radius:16px;overflow:hidden;font-family:Arial,sans-serif">' +
    '<tr><td style="padding:24px 24px;text-align:center;background:' + VERDE + '">' +
      '<div style="color:#fff;font-size:19px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Pivot</div>' +
      '<div style="color:' + VERDE_CLARO + ';font-size:11px;margin-top:3px;letter-spacing:.03em">Gestão de trabalhos, contratos e pagamentos</div>' +
    '</td></tr>' +
    '<tr><td style="padding:26px 24px 0;text-align:center">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:' + avatarCor + ';color:#fff;font-size:20px;font-weight:700;line-height:56px;text-align:center;margin:0 auto 14px;font-family:Arial,sans-serif">' + escaparHtml(avatarLetras) + '</div>' +
    '</td></tr>' +
    '<tr><td style="padding:0 24px 0;text-align:center">' +
      '<span style="display:inline-block;background:' + VERDE_CLARO + ';color:' + VERDE + ';font-size:11px;font-weight:700;padding:5px 11px;border-radius:20px">Confirmação de conta</span>' +
      '<h2 style="font-size:19px;font-weight:700;margin:12px 0 8px;color:#111">Confirme o seu email para começar</h2>' +
      '<p style="font-size:13.5px;color:' + CINZA + ';margin:0 0 6px;line-height:1.55">' + saudacao + ' A sua conta no Pivot está quase pronta — falta só confirmar que este é mesmo o seu email.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:18px 24px 8px"><a href="' + actionLink + '" style="display:block;text-align:center;background:' + VERDE + ';color:#fff;font-weight:700;font-size:14px;padding:13px;border-radius:10px;text-decoration:none">Confirmar o meu email</a></td></tr>' +
    '<tr><td style="padding:4px 24px 22px;text-align:center;font-family:Arial,sans-serif;font-size:11.5px;color:' + CINZA + '">Se não foi você quem criou esta conta, pode ignorar esta mensagem com segurança — sem confirmar, a conta não fica ativa.</td></tr>' +
    '<tr><td style="padding:16px 24px;background:' + PAPEL_FUNDO + ';border-top:1px solid ' + LINHA + '">' +
      '<table role="presentation" width="100%"><tr>' +
        '<td style="font-size:11px;color:' + CINZA + ';line-height:1.6">' +
          '<b style="color:#111">Pivot</b> — plataforma de gestão de trabalhos para profissionais autónomos e agências.<br>' +
          'Este é um email automático de confirmação de conta; não é necessário responder.' +
        '</td>' +
      '</tr></table>' +
    '</td></tr>' +
    '</table>';
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
            subject: 'Confirme o seu email para ativar a conta Pivot',
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
