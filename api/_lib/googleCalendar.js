/**
 * Helpers partilhados pelos endpoints de sincronização com o Google
 * Calendar (api/calendar/google-*.js). Ver essas funções para o desenho
 * geral: o Pivots guarda só o refresh_token (nunca o access_token de
 * curta duração) por workspace, e pede um access_token novo à Google
 * sempre que precisa de criar/atualizar/remover um evento.
 *
 * Requer as variáveis de ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
 * no projeto Vercel — o mesmo Client ID/Secret já usado no ecrã de
 * consentimento OAuth configurado no Supabase (Authentication > Providers
 * > Google). Sem estas variáveis, os pedidos de sincronização falham com
 * erro claro em vez de silenciosamente.
 */
async function sbFetch(path, opts = {}) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

/** Confirma quem é o utilizador a partir do token da sessão e devolve o
 *  workspace_id onde ele participa (mesma regra usada em toda a app: um
 *  utilizador pertence a um workspace). Lança erro com .status se algo
 *  falhar, para os endpoints devolverem o código HTTP certo. */
async function resolverWorkspaceDoPedido(req) {
  const auth = req.headers['authorization'] || '';
  const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!accessToken) { const e = new Error('Sessão em falta.'); e.status = 401; throw e; }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userResp = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + accessToken }
  });
  if (!userResp.ok) { const e = new Error('Sessão inválida ou expirada.'); e.status = 401; throw e; }
  const user = await userResp.json();

  const members = await sbFetch('workspace_members?user_id=eq.' + user.id + '&select=workspace_id&limit=1');
  const workspaceId = members && members[0] && members[0].workspace_id;
  if (!workspaceId) { const e = new Error('Workspace não encontrado.'); e.status = 404; throw e; }
  return workspaceId;
}

/** Troca o refresh_token guardado por um access_token novo (válido ~1h). */
async function obterAccessToken(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const e = new Error('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados no servidor.');
    e.status = 500;
    throw e;
  }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const body = await r.json();
  if (!r.ok) {
    const e = new Error('Falha ao renovar token Google: ' + (body.error_description || body.error || r.status));
    e.status = r.status === 400 ? 409 : 502; // 400 da Google normalmente = refresh_token revogado pelo utilizador
    e.googleError = body.error;
    throw e;
  }
  return body.access_token;
}

module.exports = { sbFetch, resolverWorkspaceDoPedido, obterAccessToken };
