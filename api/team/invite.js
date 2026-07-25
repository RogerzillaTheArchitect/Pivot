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
 * de convite com a admin API e enviamos nós mesmos o email, com marca Pivots,
 * pelo Resend — o mesmo canal já usado para lembretes e emails ao cliente.
 * O template real é o "Organization Invite" (email-templates-v2/09-...) —
 * mesmo motor de renderização usado por api/emails/send-event.js, nunca um
 * HTML próprio duplicado aqui.
 */
const { renderTemplate } = require('../_lib/emailTemplates');

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
    // Só o convite para gente NOVA (type='invite') leva ao ecrã de conclusão
    // de cadastro (nome, password, termos) — quem já tem conta (magiclink,
    // convidado para mais um workspace) já passou por isso e só precisa de
    // entrar; mandá-lo para lá pediria password de novo sem necessidade.
    const redirectTo = type === 'invite' ? (APP_URL + '/?convite=1') : APP_URL;
    return sbFetch('/auth/v1/admin/generate_link', {
      method: 'POST',
      body: JSON.stringify({ type, email, options: { redirect_to: redirectTo } })
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
    //    novoUsuario fica marcado conforme qual dos dois deu certo — decide a
    //    variante de texto/CTA do template Organization Invite mais abaixo.
    let novoUsuario = true;
    let linkResp = await gerarLink('invite');
    if (!linkResp.ok) {
      const msg = (linkResp.body && (linkResp.body.msg || linkResp.body.message || linkResp.body.error_description)) || '';
      if (/already|registered|exists/i.test(msg)) {
        novoUsuario = false;
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
    // Busca o nome de quem convida + nome da empresa (perfilData do workspace)
    // para o email deixar de ser genérico — "X convidou-o para a equipa da Y"
    // em vez de "foi convidado", que é o que dava aspeto pouco confiável.
    let quemConvidou = requester.user_metadata && (requester.user_metadata.nome || requester.user_metadata.full_name);
    let nomeEmpresa = null;
    try {
      const perfil = await sbFetch('/rest/v1/kv_store?workspace_id=eq.' + workspace_id + '&key=eq.pivot-perfilData&select=value');
      const perfilData = perfil.ok && perfil.body && perfil.body[0] && perfil.body[0].value;
      if (perfilData) {
        if (!quemConvidou && perfilData.nome) quemConvidou = perfilData.nome;
        if (perfilData.empresa) nomeEmpresa = perfilData.empresa;
      }
    } catch (e) { /* segue sem personalização se falhar */ }

    const papelLabel = papel === 'Editor' ? 'Editor' : papel === 'Viewer' ? 'Visualizador' : papel;
    let emailEnviado = false;
    if (RESEND_KEY && FROM_EMAIL && actionLink) {
      try {
        const html = renderTemplate('organizationInvite', {
          __blocks: { USER_EMAIL_ROW: !novoUsuario },
          ORGANIZATION_NAME: nomeEmpresa || 'Pivots',
          INVITER_NAME: quemConvidou || 'Um administrador',
          ROLE_SUFFIX: ', como ' + papelLabel,
          USER_EMAIL: email,
          ORG_INVITE_INTRO: novoUsuario ? 'Crie sua conta para aceitar o convite e começar a colaborar.' : 'Utilize o botão abaixo para entrar e aceitar o convite.',
          ACTION_URL: actionLink,
          ACTION_CTA_LABEL: novoUsuario ? 'Criar conta e continuar' : 'Abrir organização',
          PREHEADER: (quemConvidou || 'Alguém') + ' convidou você para uma organização no Pivots.',
        });
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            reply_to: process.env.RESEND_REPLY_TO || 'contact@pivots.app',
            subject: (quemConvidou ? quemConvidou + ' convidou você' : 'Você foi convidado') + ' para uma organização no Pivots',
            html
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
