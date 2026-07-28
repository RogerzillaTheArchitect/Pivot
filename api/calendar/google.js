/**
 * POST/GET /api/calendar/google?action=connect|status|disconnect|push
 * Header: Authorization: Bearer <access_token da sessão do utilizador>
 *
 * Os 4 endpoints de sincronização com o Google Calendar (connect, status,
 * disconnect, push) foram unidos neste único arquivo porque o plano Hobby
 * da Vercel limita a 12 Serverless Functions por deployment — 4 arquivos
 * separados estouravam esse limite e derrubavam TODO o deploy (build
 * falhava com exceeded_serverless_functions_per_deployment), impedindo
 * qualquer mudança de chegar à produção. Cada ação continua isolada nas
 * suas próprias funções abaixo; só a exportação é que é uma só.
 */
const { sbFetch, resolverWorkspaceDoPedido, obterAccessToken } = require('../_lib/googleCalendar');

async function handleConnect(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método não permitido. Usa POST.' }); return; }
  const refreshToken = req.body && req.body.refresh_token;
  if (!refreshToken) { res.status(400).json({ error: 'refresh_token em falta.' }); return; }
  const workspaceId = await resolverWorkspaceDoPedido(req);
  await sbFetch('google_calendar_tokens', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ workspace_id: workspaceId, refresh_token: refreshToken, updated_at: new Date().toISOString() })
  });
  res.status(200).json({ ok: true });
}

async function handleStatus(req, res) {
  const workspaceId = await resolverWorkspaceDoPedido(req);
  const rows = await sbFetch('google_calendar_tokens?workspace_id=eq.' + workspaceId + '&select=connected_at');
  const row = rows && rows[0];
  res.status(200).json({ connected: !!row, connected_at: row ? row.connected_at : null });
}

async function handleDisconnect(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método não permitido. Usa POST.' }); return; }
  const workspaceId = await resolverWorkspaceDoPedido(req);
  await sbFetch('google_calendar_tokens?workspace_id=eq.' + workspaceId, { method: 'DELETE' });
  res.status(200).json({ ok: true });
}

function corpoEvento(body) {
  const allDay = !body.horaIni;
  const evento = {
    summary: body.title || 'Trabalho',
    location: body.location || undefined,
    description: body.description || undefined
  };
  if (allDay) {
    const fim = body.dateFimRaw || body.dateRaw;
    const fimMaisUm = new Date(fim + 'T00:00:00');
    fimMaisUm.setDate(fimMaisUm.getDate() + 1);
    evento.start = { date: body.dateRaw };
    evento.end = { date: fimMaisUm.toISOString().slice(0, 10) };
  } else {
    evento.start = { dateTime: body.dateRaw + 'T' + body.horaIni + ':00' };
    evento.end = { dateTime: (body.dateFimRaw || body.dateRaw) + 'T' + (body.horaFim || body.horaIni) + ':00' };
  }
  return evento;
}

async function handlePush(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método não permitido. Usa POST.' }); return; }
  const { action, googleEventId } = req.body || {};
  if (action !== 'upsert' && action !== 'delete') { res.status(400).json({ error: 'action deve ser "upsert" ou "delete".' }); return; }

  const workspaceId = await resolverWorkspaceDoPedido(req);
  const tokens = await sbFetch('google_calendar_tokens?workspace_id=eq.' + workspaceId + '&select=refresh_token');
  const row = tokens && tokens[0];
  if (!row) { res.status(200).json({ ok: true, skipped: 'not_connected' }); return; }

  let accessToken;
  try {
    accessToken = await obterAccessToken(row.refresh_token);
  } catch (e) {
    if (e.googleError === 'invalid_grant') {
      await sbFetch('google_calendar_tokens?workspace_id=eq.' + workspaceId, { method: 'DELETE' });
      res.status(409).json({ error: 'A ligação ao Google Calendar expirou. Ligue novamente.', disconnected: true });
      return;
    }
    throw e;
  }

  const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const gh = { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' };

  if (action === 'delete') {
    if (!googleEventId) { res.status(200).json({ ok: true }); return; }
    const r = await fetch(base + '/' + googleEventId, { method: 'DELETE', headers: gh });
    if (!r.ok && r.status !== 404 && r.status !== 410) {
      res.status(502).json({ error: 'Falha ao remover evento no Google Calendar: ' + r.status });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  const evento = corpoEvento(req.body);
  if (googleEventId) {
    const r = await fetch(base + '/' + googleEventId, { method: 'PATCH', headers: gh, body: JSON.stringify(evento) });
    if (r.ok) {
      const data = await r.json();
      res.status(200).json({ ok: true, googleEventId: data.id });
      return;
    }
    if (r.status !== 404) {
      res.status(502).json({ error: 'Falha ao atualizar evento no Google Calendar: ' + r.status });
      return;
    }
  }
  const criar = await fetch(base, { method: 'POST', headers: gh, body: JSON.stringify(evento) });
  if (!criar.ok) {
    res.status(502).json({ error: 'Falha ao criar evento no Google Calendar: ' + criar.status });
    return;
  }
  const data = await criar.json();
  res.status(200).json({ ok: true, googleEventId: data.id });
}

module.exports = async (req, res) => {
  const action = req.query && req.query.action;
  try {
    if (action === 'connect') return await handleConnect(req, res);
    if (action === 'status') return await handleStatus(req, res);
    if (action === 'disconnect') return await handleDisconnect(req, res);
    if (action === 'push') return await handlePush(req, res);
    res.status(400).json({ error: 'action deve ser connect, status, disconnect ou push.' });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
