/**
 * POST /api/calendar/google-push
 * Header: Authorization: Bearer <access_token da sessão do utilizador>
 * Body: {
 *   action: 'upsert' | 'delete',
 *   googleEventId: string|null,   // id devolvido por uma chamada anterior, se existir
 *   title, location, description,
 *   dateRaw, horaIni, dateFimRaw, horaFim   // mesmos campos do job
 * }
 *
 * Chamado pelo cliente sempre que um trabalho é criado, editado (data,
 * hora, local, nome) ou arquivado/excluído — ver pushEventoGoogleCalendar()
 * em index.html. Falha em silêncio do lado do utilizador se não houver
 * ligação ativa (não é obrigatório ter o Google Calendar ligado).
 *
 * Devolve { ok:true, googleEventId } — o cliente guarda esse id no
 * próprio job (job.googleCalendarEventId) para saber que evento atualizar
 * ou remover da próxima vez.
 */
const { sbFetch, resolverWorkspaceDoPedido, obterAccessToken } = require('../_lib/googleCalendar');

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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }
  const { action, googleEventId } = req.body || {};
  if (action !== 'upsert' && action !== 'delete') {
    res.status(400).json({ error: 'action deve ser "upsert" ou "delete".' });
    return;
  }

  try {
    const workspaceId = await resolverWorkspaceDoPedido(req);
    const tokens = await sbFetch('google_calendar_tokens?workspace_id=eq.' + workspaceId + '&select=refresh_token');
    const row = tokens && tokens[0];
    if (!row) {
      // Sem ligação ativa — não é erro, é o caso normal de quem não ligou o Google Calendar.
      res.status(200).json({ ok: true, skipped: 'not_connected' });
      return;
    }

    let accessToken;
    try {
      accessToken = await obterAccessToken(row.refresh_token);
    } catch (e) {
      if (e.googleError === 'invalid_grant') {
        // O utilizador revogou o acesso pelo lado da Google — limpamos aqui
        // para o ecrã voltar a mostrar "Ligar ao Google Calendar".
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

    // action === 'upsert'
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
      // 404: o evento foi apagado do lado da Google — cria de novo abaixo.
    }
    const criar = await fetch(base, { method: 'POST', headers: gh, body: JSON.stringify(evento) });
    if (!criar.ok) {
      res.status(502).json({ error: 'Falha ao criar evento no Google Calendar: ' + criar.status });
      return;
    }
    const data = await criar.json();
    res.status(200).json({ ok: true, googleEventId: data.id });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
