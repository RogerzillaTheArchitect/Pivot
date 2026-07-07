/**
 * POST /api/team/lookup-user
 * Body: { access_token, email }
 *
 * Procura se já existe uma conta Pivot com este email — usado no fluxo de
 * "Adicionar Colaborador Externo" para confirmar que a pessoa já está
 * registada antes de configurar permissões. Exige sessão válida (qualquer
 * utilizador autenticado pode procurar, mas nunca vê mais do que
 * email/nome/data de criação de outra conta).
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }
  const { access_token, email } = req.body || {};
  if (!access_token || !email) {
    res.status(400).json({ error: 'access_token e email são obrigatórios.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const userResp = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + access_token }
    });
    if (!userResp.ok) {
      const detalhe = await userResp.text().catch(() => '');
      res.status(401).json({ error: 'Sessão inválida.', debug_status: userResp.status, debug_body: detalhe, debug_has_url: !!SUPABASE_URL, debug_has_key: !!SERVICE_KEY });
      return;
    }

    const alvo = email.trim().toLowerCase();
    let found = null;
    let page = 1;
    // A API admin/users da Supabase não filtra fielmente por email em todas as
    // versões — em vez de confiar no parâmetro, paginamos e comparamos o email
    // exato nós mesmos, para nunca devolver a conta errada.
    while (!found && page <= 20) {
      const listResp = await fetch(SUPABASE_URL + '/auth/v1/admin/users?page=' + page + '&per_page=200', {
        headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY }
      });
      const listBody = await listResp.json().catch(() => ({}));
      const users = (listBody && listBody.users) || [];
      found = users.find(u => u.email && u.email.toLowerCase() === alvo) || null;
      if (users.length < 200) break;
      page++;
    }

    if (!found) {
      res.status(200).json({ exists: false });
      return;
    }

    res.status(200).json({
      exists: true,
      userId: found.id,
      email: found.email,
      nome: (found.user_metadata && (found.user_metadata.nome || found.user_metadata.full_name)) || null,
      desde: found.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado ao procurar utilizador.', details: String(err && err.message || err) });
  }
};
