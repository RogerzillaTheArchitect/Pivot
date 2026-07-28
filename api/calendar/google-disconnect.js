/**
 * POST /api/calendar/google-disconnect
 * Header: Authorization: Bearer <access_token da sessão do utilizador>
 *
 * Remove a ligação: apaga o refresh_token guardado. Não apaga os eventos
 * já criados no Google Calendar do utilizador (ficam lá, como qualquer
 * evento normal) — só para de os manter sincronizados a partir de agora.
 */
const { sbFetch, resolverWorkspaceDoPedido } = require('../_lib/googleCalendar');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }
  try {
    const workspaceId = await resolverWorkspaceDoPedido(req);
    await sbFetch('google_calendar_tokens?workspace_id=eq.' + workspaceId, { method: 'DELETE' });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
