/**
 * GET /api/cron/send-reminders
 *
 * Disparado diariamente pelo Vercel Cron (ver vercel.json). Percorre todos
 * os workspaces, encontra lembretes cuja data é hoje e ainda não foram
 * enviados, envia email via Resend ao profissional (dono do workspace) e
 * ao cliente (se o trabalho tiver email), e marca os lembretes como
 * enviados de volta na kv_store.
 *
 * Não usa nenhuma dependência nova — só fetch nativo do runtime Node do
 * Vercel, contra a REST API do Supabase e a API HTTP do Resend.
 */
module.exports = async (req, res) => {
  if (req.headers['authorization'] !== 'Bearer ' + process.env.CRON_SECRET) {
    res.status(401).json({ error: 'Não autorizado.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

  async function sb(path, opts = {}) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      ...opts,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      }
    });
    if (!r.ok) throw new Error('Supabase ' + path + ' falhou: ' + r.status + ' ' + await r.text());
    return r.status === 204 ? null : r.json();
  }

  async function emailDoDono(userId) {
    const r = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + userId, {
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY }
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data && data.email;
  }

  async function enviarEmail(to, subject, html) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, reply_to: process.env.RESEND_REPLY_TO || 'contact@pivots.app', subject, html })
    });
    if (!r.ok) throw new Error('Resend falhou: ' + r.status + ' ' + await r.text());
  }

  const hojeISO = new Date().toISOString().slice(0, 10);
  const rows = await sb('kv_store?key=eq.pivot-jobsData&select=workspace_id,value');

  let lembretesEnviados = 0;
  const erros = [];

  for (const row of rows) {
    const jobsData = row.value || {};
    let alterado = false;

    for (const jobId of Object.keys(jobsData)) {
      const job = jobsData[jobId];
      const devidos = (job.reminders || []).filter(r => r.dataISO === hojeISO && !r.enviado);
      if (!devidos.length) continue;

      try {
        const members = await sb(
          'workspace_members?workspace_id=eq.' + row.workspace_id + '&papel=eq.Admin&select=user_id&limit=1'
        );
        const ownerId = members && members[0] && members[0].user_id;
        const ownerEmail = ownerId ? await emailDoDono(ownerId) : null;

        const assunto = 'Lembrete: ' + job.client + ' — ' + (job.typeLabel || 'trabalho');
        const corpo = '<p>Lembrete automático do Pivot.</p><p><b>' + job.client + '</b> — ' +
          (job.typeLabel || '') + '<br>Data: ' + (job.date || '') + '</p>';

        const destinatarios = [...new Set([ownerEmail, job.email].filter(Boolean))];
        for (const destinatario of destinatarios) {
          await enviarEmail(destinatario, assunto, corpo);
        }

        devidos.forEach(r => { r.enviado = true; });
        alterado = true;
        lembretesEnviados++;
      } catch (e) {
        erros.push({ workspace_id: row.workspace_id, jobId, error: String(e && e.message || e) });
      }
    }

    if (alterado) {
      await sb('kv_store?workspace_id=eq.' + row.workspace_id + '&key=eq.pivot-jobsData', {
        method: 'PATCH',
        body: JSON.stringify({ value: jobsData, updated_at: new Date().toISOString() })
      });
    }
  }

  res.status(200).json({ ok: true, lembretesEnviados, erros });
};
