/**
 * POST /api/billing/redeem
 * Body: { access_token, workspace_id, code }
 *
 * Resgata um código de plano (plan_redeem_codes) e atualiza perfilData.plano
 * do workspace. Códigos "master" são reutilizáveis (para testar as funções
 * pagas de cada plano); códigos "single" têm max_usos e ficam inativos ao
 * esgotar. Tudo validado com a service_role — o código nunca é verificado
 * no cliente.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }

  const { access_token, workspace_id, code } = req.body || {};
  if (!access_token || !workspace_id || !code) {
    res.status(400).json({ error: 'access_token, workspace_id e code são obrigatórios.' });
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
    return { ok: r.ok, status: r.status, body: r.status === 204 ? null : await r.json().catch(() => ({})) };
  }

  try {
    // 1) Confirmar sessão e que o utilizador pertence ao workspace.
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
    if (!membership.ok || !membership.body || !membership.body[0]) {
      res.status(403).json({ error: 'Sem acesso a este workspace.' });
      return;
    }

    // 2) Procurar o código.
    const codeNorm = String(code).trim().toUpperCase();
    const found = await sbFetch('/rest/v1/plan_redeem_codes?code=eq.' + encodeURIComponent(codeNorm) + '&select=*');
    const row = found.ok && found.body && found.body[0];
    if (!row || !row.ativo) {
      res.status(404).json({ error: 'Código inválido ou já usado.' });
      return;
    }
    if (row.tipo !== 'master' && row.max_usos != null && row.usos >= row.max_usos) {
      res.status(404).json({ error: 'Código inválido ou já usado.' });
      return;
    }

    // 3) Atualizar o plano do workspace (kv_store, mesma chave usada pelo app).
    const atual = await fetch(
      SUPABASE_URL + '/rest/v1/kv_store?workspace_id=eq.' + workspace_id + '&key=eq.pivot-perfilData',
      { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } }
    ).then(r => r.json());
    const perfil = (atual[0] && atual[0].value) || {};
    perfil.plano = row.plano;
    await fetch(SUPABASE_URL + '/rest/v1/kv_store', {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ workspace_id, key: 'pivot-perfilData', value: perfil, updated_at: new Date().toISOString() })
    });

    // 4) Registar o resgate; incrementa uso e desativa se um código "single" esgotar.
    await sbFetch('/rest/v1/plan_redeem_log', {
      method: 'POST',
      body: JSON.stringify({ code: codeNorm, workspace_id, plano: row.plano })
    });
    if (row.tipo !== 'master') {
      const novosUsos = row.usos + 1;
      const desativa = row.max_usos != null && novosUsos >= row.max_usos;
      await sbFetch('/rest/v1/plan_redeem_codes?code=eq.' + encodeURIComponent(codeNorm), {
        method: 'PATCH',
        body: JSON.stringify({ usos: novosUsos, ativo: !desativa })
      });
    }

    res.status(200).json({ ok: true, plano: row.plano });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado ao resgatar código.', details: String(err && err.message || err) });
  }
};
