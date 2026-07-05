/**
 * POST /api/team/invite
 * Body: { access_token, workspace_id, email, papel }
 * Header: nenhum necessário — o access_token vem no body (o app já o guarda em sessaoAtual/session).
 *
 * Convida um novo membro para o workspace. Só funciona se quem pede for Admin
 * do workspace em causa (verificado com a service_role, sem confiar no cliente).
 * Usa fetch nativo — sem dependências novas.
 */
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
    return { ok: r.ok, status: r.status, body: r.status === 204 ? null : await r.json() };
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

    // 2) Convidar (ou reutilizar) o utilizador via Supabase Auth admin API.
    let invitedUserId = null;
    const inviteResp = await fetch(SUPABASE_URL + '/auth/v1/invite', {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const inviteBody = await inviteResp.json().catch(() => ({}));
    if (inviteResp.ok) {
      invitedUserId = inviteBody.id;
    } else if (inviteBody && /already registered|already exists/i.test(inviteBody.msg || inviteBody.message || '')) {
      // Já existe conta com este email — procurar o id em vez de falhar.
      const listResp = await sbFetch('/auth/v1/admin/users?email=' + encodeURIComponent(email));
      const found = listResp.body && listResp.body.users && listResp.body.users[0];
      if (!found) { res.status(500).json({ error: 'Utilizador já existe mas não foi encontrado.' }); return; }
      invitedUserId = found.id;
    } else {
      res.status(500).json({ error: inviteBody.msg || inviteBody.message || 'Erro ao convidar.' });
      return;
    }

    // 3) Associar ao workspace com o papel escolhido (upsert — evita duplicar se já for membro).
    const upsert = await sbFetch('/rest/v1/workspace_members?on_conflict=workspace_id,user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ workspace_id, user_id: invitedUserId, papel, email })
    });
    if (!upsert.ok) {
      res.status(500).json({ error: 'Erro ao associar membro ao workspace.', details: upsert.body });
      return;
    }

    res.status(200).json({ ok: true, userId: invitedUserId, email, papel });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado ao convidar.', details: String(err && err.message || err) });
  }
};
