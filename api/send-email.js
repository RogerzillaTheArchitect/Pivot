// PIVOT — /api/send-email
// Onde vai: cria uma pasta "api" na raiz do teu projeto Vercel e coloca
// este ficheiro lá dentro como api/send-email.js
//
// Variável de ambiente necessária no Vercel (Project Settings → Environment Variables):
//   RESEND_API_KEY = a tua chave do Resend
//
// O frontend chama isto com: fetch('/api/send-email', { method:'POST', body: JSON.stringify({...}) })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, subject, html } = req.body || {};
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Faltam campos: to, subject, html' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Pivot <onboarding@resend.dev>', // troca pelo teu domínio verificado quando o tiveres
        to,
        subject,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao enviar email', details: String(err) });
  }
}
