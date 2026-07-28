/**
 * GET /api/calendar/feed?token=xxx
 *
 * Feed de calendário no formato .ics, protegido por um token secreto
 * gerado pelo utilizador em Perfil > Configurações > Sincronização de
 * Calendário. Qualquer app de calendário que suporte "assinar por URL"
 * (Google Calendar, Apple Calendar, Outlook e praticamente qualquer
 * outro) consegue subscrever este mesmo link e mantém-se sincronizado
 * sozinho, sem precisar de OAuth nem de acesso à conta de calendário do
 * utilizador — o Pivots nunca escreve nem lê nada nos calendários de
 * terceiros, só publica este feed.
 *
 * O token não expira sozinho, mas pode ser revogado/substituído a
 * qualquer momento pelo utilizador (ver revogarTokenCalendario() em
 * index.html) — isso invalida imediatamente o link antigo.
 */
function fmtICSDate(dataISO, horaHHMM) {
  // dataISO: 'YYYY-MM-DD'; horaHHMM: 'HH:MM' ou null (evento de dia inteiro)
  if (!dataISO) return null;
  const [ano, mes, dia] = dataISO.split('-');
  if (!horaHHMM) return { value: ano + mes + dia, allDay: true };
  const [h, m] = horaHHMM.split(':');
  return { value: ano + mes + dia + 'T' + h.padStart(2, '0') + m.padStart(2, '0') + '00', allDay: false };
}
function escapeICS(s) {
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
function foldLine(line) {
  // RFC 5545: linhas com mais de 75 octetos devem ser dobradas com \r\n + espaço
  if (line.length <= 75) return line;
  let out = '';
  let rest = line;
  while (rest.length > 75) {
    out += rest.slice(0, 75) + '\r\n ';
    rest = rest.slice(75);
  }
  return out + rest;
}

module.exports = async (req, res) => {
  const token = req.query.token;
  if (!token) {
    res.status(400).send('Token em falta.');
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  async function sb(path) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY }
    });
    if (!r.ok) throw new Error('Supabase ' + path + ' falhou: ' + r.status);
    return r.json();
  }

  try {
    const tokens = await sb(
      'calendar_feed_tokens?token=eq.' + encodeURIComponent(token) + '&revoked=eq.false&select=workspace_id'
    );
    const row = tokens && tokens[0];
    if (!row) {
      res.status(404).send('Link de sincronização inválido ou revogado.');
      return;
    }
    const workspaceId = row.workspace_id;

    const jobsRows = await sb(
      'kv_store?workspace_id=eq.' + workspaceId + '&key=eq.pivot-jobsData&select=value'
    );
    const jobsData = (jobsRows && jobsRows[0] && jobsRows[0].value) || {};

    const linhas = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pivots//Calendar Feed//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Pivots',
      'REFRESH-INTERVAL;VALUE=DURATION:PT4H',
      'X-PUBLISHED-TTL:PT4H'
    ];

    Object.keys(jobsData).forEach(jobId => {
      const job = jobsData[jobId];
      if (!job || !job.dateRaw) return;
      const inicio = fmtICSDate(job.dateRaw, job.horaIni);
      if (!inicio) return;
      const fim = fmtICSDate(job.dateFimRaw || job.dateRaw, job.horaFim);

      linhas.push('BEGIN:VEVENT');
      linhas.push('UID:' + jobId + '@pivots.app');
      linhas.push('DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z');
      if (inicio.allDay) {
        linhas.push('DTSTART;VALUE=DATE:' + inicio.value);
        linhas.push('DTEND;VALUE=DATE:' + (fim && fim.allDay ? fim.value : inicio.value));
      } else {
        linhas.push('DTSTART:' + inicio.value);
        linhas.push('DTEND:' + (fim && !fim.allDay ? fim.value : inicio.value));
      }
      linhas.push(foldLine('SUMMARY:' + escapeICS(job.nome || job.typeLabel || 'Trabalho')));
      if (job.localCompleto || job.local) linhas.push(foldLine('LOCATION:' + escapeICS(job.localCompleto || job.local)));
      if (job.client) linhas.push(foldLine('DESCRIPTION:' + escapeICS('Cliente: ' + job.client)));
      linhas.push('END:VEVENT');
    });

    linhas.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=1800');
    res.status(200).send(linhas.join('\r\n'));
  } catch (e) {
    res.status(500).send('Erro ao gerar o calendário.');
  }
};
