/* Pivots — auth supabase
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ============================================================
     PIVOT — Integração Supabase (Auth + Base de Dados + Portal)
     ============================================================ */
  const SUPABASE_URL = 'https://erqdsaczclnqbyxjahgs.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RzySKs0BZaaPzukXHD8S_A_o-VKt-nb';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const PIVOT_VERSAO='1.0.0';
  let currentWorkspaceId = null;
  let currentUser = null;

  async function pivotSignIn(email, password){
    // NÃO chamamos onAuthReady aqui. O onAuthStateChange (abaixo) é a ÚNICA
    // fonte de verdade que reage ao login — evita disparar onAuthReady duas vezes
    // em simultâneo (o que causava deadlock ao ler workspace_members).
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function pivotSignInGoogle(){
    /* signInWithOAuth não rejeita a promise em caso de erro — devolve
       {data,error}. Sem checar isso, uma falha (ex.: provedor Google não
       ativado no projeto Supabase, ou redirect URL fora da allowlist)
       ficava completamente muda: nada acontecia e ninguém via porquê. */
    const { error } = await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin } });
    if (error) {
      console.error('Erro no login com Google:', error);
      showToast(t('login.googleError')+(error.message?(': '+error.message):''));
    }
  }
  async function pivotSignOut(){
    await sb.auth.signOut();
    currentWorkspaceId = null; currentUser = null;
    location.reload();
  }
  async function carregarWorkspace(session){
    currentUser = session.user;
    /* Conta nova (sobretudo via Google, onde a sessão fica pronta assim que o
       browser volta do OAuth) pode chegar aqui antes do trigger da BD que cria
       a linha em workspace_members terminar de correr — sem isto, a primeira
       leitura vinha vazia (PGRST116, "no rows") e a pessoa ficava presa num
       ecrã de erro mesmo com o login a ter funcionado. Repete algumas vezes
       com um pequeno intervalo antes de assumir que é um erro real. */
    let data, error;
    for (let tentativa=0; tentativa<5; tentativa++){
      ({ data, error } = await sb.from('workspace_members').select('workspace_id').eq('user_id', currentUser.id).limit(1).single());
      if (!error) break;
      if (error.code !== 'PGRST116') break; // erro real (não "sem linhas ainda") — não adianta repetir
      await new Promise(r=>setTimeout(r, 700));
    }
    if (error) {
      console.error('Erro a obter workspace:', error);
      const aviso=document.createElement('div');
      aviso.style.cssText='position:fixed;top:0;left:0;right:0;background:#b91c1c;color:#fff;text-align:center;padding:10px 16px;font:600 13.5px system-ui,sans-serif;z-index:99999';
      aviso.textContent='Login funcionou, mas não foi possível carregar o teu workspace. Detalhe técnico: '+(error.message||'erro desconhecido');
      document.body.prepend(aviso);
      return false;
    }
    currentWorkspaceId = data.workspace_id;
    await carregarDadosDaConta();
    const nomeMeta = currentUser.user_metadata && (currentUser.user_metadata.nome || currentUser.user_metadata.full_name);
    if (nomeMeta && typeof perfilData!=='undefined' && !perfilData.nome) {
      perfilData.nome = nomeMeta;
      if (typeof savePerfilData==='function') savePerfilData();
      if (typeof aplicarPerfilData==='function') aplicarPerfilData();
    }
    return true;
  }

  // FONTE ÚNICA DE VERDADE para reação à autenticação.
  // Dispara no arranque (se já há sessão), no login por email/password, e no regresso do Google.
  let aProcessarAuth = false;
  /* auth pronta = já sabemos se há sessão ou não, seguro esconder o splash.
     Ligado ao próprio temporizador do splash mais abaixo, para nunca mostrar
     a landing page/ecrã de login por baixo do logo só porque o splash tinha
     um tempo fixo mais curto do que a verificação de sessão demorou. */
  let authPronta = false;
  function tentarEsconderSplash(){
    if(!authPronta) return;
    const el=document.getElementById('splash');
    if(el && !el.classList.contains('hide')){ el.classList.add('hide'); if(typeof ajustarPaddingEcra==='function') ajustarPaddingEcra(); }
  }

  // Substitui o antigo window.storage (localStorage) por leitura/escrita real na base de dados
  window.storage = {
    async set(key, value){
      if (!currentWorkspaceId) return null;
      const { error } = await sb.from('kv_store').upsert({ workspace_id: currentWorkspaceId, key, value: JSON.parse(value), updated_at: new Date().toISOString() });
      if (error) { console.error('storage.set falhou:', error); return null; }
      return { key, value };
    },
    async get(key){
      if (!currentWorkspaceId) return null;
      const { data, error } = await sb.from('kv_store').select('value').eq('workspace_id', currentWorkspaceId).eq('key', key).maybeSingle();
      if (error) { console.error('storage.get falhou:', error); return null; }
      if (!data) return null;
      return { key, value: JSON.stringify(data.value) };
    },
    async delete(key){
      if (!currentWorkspaceId) return null;
      const { error } = await sb.from('kv_store').delete().eq('workspace_id', currentWorkspaceId).eq('key', key);
      return error ? null : { key, deleted: true };
    }
  };
