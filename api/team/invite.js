/**
 * POST /api/team/invite
 * Body: { access_token, workspace_id, email, papel }
 *
 * Convida um novo membro para o workspace. Só funciona se quem pede for Admin
 * do workspace em causa (verificado com a service_role, sem confiar no cliente).
 *
 * Entrega do email: em vez de deixar o Supabase enviar o convite pelo seu SMTP
 * embutido (que só funciona se houver SMTP personalizado configurado no projeto
 * Supabase — caso contrário os convites simplesmente não chegam), geramos o link
 * de convite com a admin API e enviamos nós mesmos o email, com marca Pivot,
 * pelo Resend — o mesmo canal já usado para lembretes e emails ao cliente.
 * Usa fetch nativo — sem dependências novas.
 */

function construirEmailConviteHtml(actionLink, papel) {
  const VERDE = '#15532D', VERDE_CLARO = '#EAF3EC', CINZA = '#6B6459', LINHA = '#E7E2D6';
  const papelLabel = papel === 'Editor' ? 'Editor' : papel === 'Viewer' ? 'Visualizador' : papel;
  return '<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid ' + LINHA + ';border-radius:16px;overflow:hidden;font-family:Arial,sans-serif">' +
    '<tr><td style="padding:28px 24px;text-align:center;background:' + VERDE + '"><div style="color:#fff;font-size:19px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Pivot</div></td></tr>' +
    '<tr><td style="padding:22px 24px 0">' +
      '<span style="display:inline-block;background:' + VERDE_CLARO + ';color:' + VERDE + ';font-size:11px;font-weight:700;padding:5px 11px;border-radius:20px">Convite para equipa</span>' +
      '<h2 style="font-size:20px;font-weight:700;margin:12px 0 8px;color:#111">Convidaram-no para uma equipa no Pivot</h2>' +
      '<p style="font-size:13px;color:' + CINZA + ';margin:0 0 6px">Foi convidado a colaborar no espaço de trabalho da equipa como <b>' + papelLabel + '</b>. Aceite o convite para começar.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:6px 24px 8px"><a href="' + actionLink + '" style="display:block;text-align:center;background:' + VERDE + ';color:#fff;font-weight:700;font-size:14px;padding:13px;border-radius:10px;text-decoration:none">Aceitar convite</a></td></tr>' +
    '<tr><td style="padding:0 24px 22px;text-align:center;font-family:Arial,sans-serif;font-size:11.5px;color:' + CINZA + '">Se não esperava este convite, pode ignorar este email com segurança.</td></tr>' +
    '<tr><td style="padding:14px 24px;border-top:1px solid ' + LINHA + ';text-align:center;font-size:11px;color:' + CINZA + '">Pivot &nbsp;·&nbsp; Este é um email automático — não é necessário responder.</td></tr>' +
    '</table>';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }

  const { access_token, workspace_id, email, papel } = req.body || {};
  if (!access_token || !workspace_id || !email || !papel) {
    res.status(400).json({ error: 'access_token, workspace_id, email e papel são obrigatórios.' });
    return;
  }
  if (!['Admin', 'Editor', 'Viewer'].includes(papel)) {
    res.status(400).json({ error: 'Papel inválido.' });
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

  // Gera um link de autenticação com a admin API. type='invite' cria o utilizador
  // se ainda não existir; type='magiclink' serve para quem já tem conta.
  async function gerarLink(type) {
    return sbFetch('/auth/v1/admin/generate_link', {
      method: 'POST',
      body: JSON.stringify({ type, email, options: { redirect_to: APP_URL } })
    });
  }

  try {
    // 1) Confirmar quem está a pedir e que é Admin deste workspace.
    const userResp = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + access_token }
    });
    if (!userResp.ok) {
      res.status(401).json({ error: 'Sessão inválida.' });
      return;
    }
    const requester = await userResp.json();

    const membership = await sbFetch(
      '/rest/v1/workspace_members?workspace_id=eq.' + workspace_id + '&user_id=eq.' + requester.id + '&select=papel'
    );
    if (!membership.ok || !membership.body || !membership.body[0] || membership.body[0].papel !== 'Admin') {
      res.status(403).json({ error: 'Só administradores podem convidar membros.' });
      return;
    }

    // 2) Gerar o link de convite (ou magic link, se já for utilizador registado).
    let linkResp = await gerarLink('invite');
    if (!linkResp.ok) {
      const msg = (linkResp.body && (linkResp.body.msg || linkResp.body.message || linkResp.body.error_description)) || '';
      if (/already|registered|exists/i.test(msg)) {
        linkResp = await gerarLink('magiclink');
      }
      if (!linkResp.ok) {
        res.status(500).json({ error: (linkResp.body && (linkResp.body.msg || linkResp.body.message)) || 'Erro ao gerar convite.' });
        return;
      }
    }

    const lb = linkResp.body || {};
    const actionLink = lb.action_link || lb.properties && lb.properties.action_link;
    const invitedUserId = (lb.user && lb.user.id) || lb.id || lb.user_id;
    if (!invitedUserId) {
      res.status(500).json({ error: 'Não foi possível identificar o utilizador convidado.' });
      return;
    }

    // 3) Associar ao workspace com o papel escolhido (upsert — evita duplicar).
    const upsert = await sbFetch('/rest/v1/workspace_members?on_conflict=workspace_id,user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ workspace_id, user_id: invitedUserId, papel, email })
    });
    if (!upsert.ok) {
      res.status(500).json({ error: 'Erro ao associar membro ao workspace.', details: upsert.body });
      return;
    }

    // 4) Enviar o email de convite pelo Resend (canal fiável). Se não houver
    //    RESEND configurado ou o link não vier, devolvemos ok na mesma — o membro
    //    já ficou associado — mas sinalizamos que o email não foi enviado.
    let emailEnviado = false;
    if (RESEND_KEY && FROM_EMAIL && actionLink) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject: 'Convidaram-no para uma equipa no Pivot',
            html: construirEmailConviteHtml(actionLink, papel)
          })
        });
        emailEnviado = r.ok;
      } catch (e) { emailEnviado = false; }
    }

    res.status(200).json({ ok: true, userId: invitedUserId, email, papel, emailEnviado });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado ao convidar.', details: String(err && err.message || err) });
  }
};
