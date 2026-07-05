/**
 * POST /api/emails/send-event
 * Body: { to, subject, html }
 *
 * Envio simples de um email já pronto (HTML construído no frontend por
 * construirEmailUniversal). Sem lógica de negócio aqui — só a chamada ao
 * Resend, para a chave nunca chegar ao browser. Usa fetch nativo, sem
 * dependências novas.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }
  const { to, subject, html } = req.body || {};
  if (!to || !subject || !html) {
    res.status(400).json({ error: 'to, subject e html são obrigatórios.' });
    return;
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to, subject, html })
    });
    if (!r.ok) {
      res.status(500).json({ error: 'Resend falhou.', details: await r.text() });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado ao enviar.', details: String(err && err.message || err) });
  }
};
