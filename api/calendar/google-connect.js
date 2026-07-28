/**
 * POST /api/calendar/google-connect
 * Header: Authorization: Bearer <access_token da sessão do utilizador>
 * Body: { refresh_token: string }
 *
 * Chamado pelo cliente logo após o fluxo de "Ligar ao Google Calendar"
 * (ver conectarGoogleCalendar() em index.html): o Supabase devolve, na
 * sessão, o provider_refresh_token do Google quando o login pediu o
 * scope de calendário com access_type=offline&prompt=consent. Esse
 * refresh_token só aparece nessa resposta específica — não fica
 * disponível depois — por isso tem de ser guardado já aqui.
 */
const { sbFetch, resolverWorkspaceDoPedido } = require('../_lib/googleCalendar');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }
  const refreshToken = req.body && req.body.refresh_token;
  if (!refreshToken) {
    res.status(400).json({ error: 'refresh_token em falta.' });
    return;
  }
  try {
    const workspaceId = await resolverWorkspaceDoPedido(req);
    await sbFetch('google_calendar_tokens', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ workspace_id: workspaceId, refresh_token: refreshToken, updated_at: new Date().toISOString() })
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
