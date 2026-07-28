/**
 * GET /api/calendar/google-status
 * Header: Authorization: Bearer <access_token da sessão do utilizador>
 *
 * Devolve só {connected:true/false} — nunca o token em si. Usado pelo
 * ecrã Perfil > Configurações > Sincronização de Calendário para saber
 * se já existe uma ligação ativa.
 */
const { sbFetch, resolverWorkspaceDoPedido } = require('../_lib/googleCalendar');

module.exports = async (req, res) => {
  try {
    const workspaceId = await resolverWorkspaceDoPedido(req);
    const rows = await sbFetch('google_calendar_tokens?workspace_id=eq.' + workspaceId + '&select=connected_at');
    const row = rows && rows[0];
    res.status(200).json({ connected: !!row, connected_at: row ? row.connected_at : null });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
