/**
 * POST /api/account/delete
 * Header: Authorization: Bearer <access_token da sessão do utilizador>
 *
 * Elimina de verdade a conta e os dados do utilizador — antes disto, o
 * botão "Excluir conta" (confirmarApagarDados em index.html) só mostrava
 * um toast e não apagava nada. Regra de negócio:
 *
 *   - Se o utilizador for Admin de um workspace: apaga o workspace inteiro
 *     (kv_store, portal_tokens, external_collaborators, analytics_events,
 *     calendar_feed_tokens, todos os workspace_members e a própria linha
 *     em workspaces) — os restantes membros perdem acesso, porque não há
 *     outro dono para o workspace continuar a existir. O cliente avisa
 *     disto antes de confirmar (ver confirmarApagarDados()).
 *   - Se o utilizador for só Editor/Visualizador: remove apenas a sua
 *     própria linha em workspace_members, sem tocar nos dados do
 *     workspace (que continua a pertencer aos outros membros).
 *   - No final, elimina sempre a conta de autenticação do próprio
 *     utilizador (auth.users), depois de já ter removido as suas
 *     referências em workspace_members (evita violar a foreign key).
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }

  const auth = req.headers['authorization'] || '';
  const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!accessToken) {
    res.status(401).json({ error: 'Sessão em falta.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  async function sb(path, opts = {}) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      ...opts,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(opts.headers || {})
      }
    });
    if (!r.ok) throw new Error('Supabase ' + path + ' falhou: ' + r.status + ' ' + await r.text());
    return r.status === 204 ? null : r.json();
  }

  try {
    // Confirma a identidade a partir do próprio token da sessão — nunca
    // confia num user_id vindo do corpo do pedido.
    const userResp = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + accessToken }
    });
    if (!userResp.ok) {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return;
    }
    const user = await userResp.json();
    const userId = user.id;

    const memberships = await sb('workspace_members?user_id=eq.' + userId + '&select=workspace_id,papel');
    const workspacesEliminados = [];

    for (const m of memberships) {
      if (m.papel === 'Admin') {
        const wsId = m.workspace_id;
        await sb('kv_store?workspace_id=eq.' + wsId, { method: 'DELETE' });
        await sb('portal_tokens?workspace_id=eq.' + wsId, { method: 'DELETE' });
        await sb('external_collaborators?workspace_id=eq.' + wsId, { method: 'DELETE' });
        await sb('analytics_events?workspace_id=eq.' + wsId, { method: 'DELETE' });
        await sb('calendar_feed_tokens?workspace_id=eq.' + wsId, { method: 'DELETE' });
        await sb('workspace_members?workspace_id=eq.' + wsId, { method: 'DELETE' });
        await sb('workspaces?id=eq.' + wsId, { method: 'DELETE' });
        workspacesEliminados.push(wsId);
      } else {
        await sb('workspace_members?workspace_id=eq.' + m.workspace_id + '&user_id=eq.' + userId, { method: 'DELETE' });
      }
    }

    const delUserResp = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + userId, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY }
    });
    if (!delUserResp.ok) {
      res.status(500).json({ error: 'Dados do workspace apagados, mas falhou eliminar a conta de autenticação. Contacte o suporte.', workspacesEliminados });
      return;
    }

    res.status(200).json({ ok: true, workspacesEliminados });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao eliminar a conta: ' + (e && e.message || e) });
  }
};
