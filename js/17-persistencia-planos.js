/* Pivots — persistencia planos
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== StorageAdapter — camada única de persistência =====
     Nenhuma outra parte da aplicação deve chamar window.storage diretamente.
     Ordem de preferência: window.storage (ambiente Claude) → localStorage
     (funciona fora do Claude, ex. Vercel) → memória (último recurso, não
     sobrevive a um refresh). O comportamento dentro do Claude.ai mantém-se
     exatamente igual ao anterior. */
  const StorageAdapter = (function(){
    const KNOWN_KEYS=['pivot-jobsData','pivot-clientesData','pivot-tarefasData','pivot-lembretesData','pivot-listasData','pivot-custosData',
      'pivot-referenciasData','pivot-modelosUso','pivot-servicosData',
      'pivot-perfilData','pivot-metas','pivot-lembretesPerfil','pivot-sessao','pivot-tema'];
    const memoryStore={};
    function hasClaudeStorage(){ return typeof window!=='undefined' && !!window.storage; }
    function hasLocalStorage(){
      try{
        if(typeof window==='undefined' || !window.localStorage) return false;
        const t='__pivot_ls_test__'; window.localStorage.setItem(t,'1'); window.localStorage.removeItem(t);
        return true;
      }catch(e){ return false; }
    }
    async function save(key, value){
      const json=JSON.stringify(value);
      if(hasClaudeStorage()){
        try{
          let r=await window.storage.set(key, json);
          if(!r) r=await window.storage.set(key, json); // window.storage.set engole os seus próprios erros e devolve null em vez de rejeitar — sem isto, uma falha nunca era detetada nem repetida.
          if(r) return true;
        }catch(e){}
      }
      if(hasLocalStorage()){
        try{ window.localStorage.setItem(key, json); return true; }catch(e){}
      }
      memoryStore[key]=json;
      if(typeof showToast==='function') showToast(typeof t==='function' ? t('toast.saveFailedOffline') : 'Não foi possível guardar — a app tentará novamente.');
      return false;
    }
    async function load(key){
      if(hasClaudeStorage()){
        try{
          const r=await window.storage.get(key);
          if(r && r.value!=null) return JSON.parse(r.value);
        }catch(e){}
      }
      if(hasLocalStorage()){
        try{
          const raw=window.localStorage.getItem(key);
          if(raw!=null) return JSON.parse(raw);
        }catch(e){}
      }
      if(key in memoryStore){ try{ return JSON.parse(memoryStore[key]); }catch(e){} }
      return null;
    }
    async function remove(key){
      if(hasClaudeStorage()){
        try{ await window.storage.delete(key); }catch(e){}
      }
      if(hasLocalStorage()){
        try{ window.localStorage.removeItem(key); }catch(e){}
      }
      delete memoryStore[key];
    }
    async function clear(){
      for(const key of KNOWN_KEYS){ await remove(key); }
    }
    return {save, load, remove, clear, KNOWN_KEYS};
  })();

  /* ===== Persistência genérica (Cliente / Evento / Tarefa) ===== */
  let clientesData={}, tarefasData={}, servicosData=[];
  const _saveTimers={};
  function savePersisted(key, getData){
    clearTimeout(_saveTimers[key]);
    _saveTimers[key]=setTimeout(async()=>{
      try{ await StorageAdapter.save(key, getData()); }catch(e){}
    }, 400);
  }
  async function loadPersisted(key, applyData){
    try{
      const value=await StorageAdapter.load(key);
      if(value!=null) applyData(value);
    }catch(e){}
  }
  function saveClientesData(){ savePersisted('pivot-clientesData', ()=>clientesData); }
  function saveTarefasData(){ savePersisted('pivot-tarefasData', ()=>tarefasData); }
  function saveServicosData(){ savePersisted('pivot-servicosData', ()=>servicosData); }
  async function loadClientesData(){ await loadPersisted('pivot-clientesData', d=>{ clientesData=d; }); }
  async function loadServicosData(){ await loadPersisted('pivot-servicosData', d=>{ servicosData=d||[]; }); }
  let perfilData={nome:'', email:'', telefonePessoal:'', documentoNacional:'', empresa:'', categoria:'', telefone:'', endereco:'', website:'', empresaEmail:'', empresaFotoUrl:null, taxId:'', corMarca:'#295244', corNome:'verde', idiomaUI:'English', idiomaPortal:'English', fotoUrl:null, assinaturaImg:null, plano:'Free', timezone:'UTC', dateFormat:'DD/MM/YYYY', moeda:'EUR', notifEmail:false, notifApp:true,
    metodosPagamento:{ revolut:{ativo:false,valor:'',padrao:false}, iban:{ativo:false,valor:'',padrao:false}, mbway:{ativo:false,valor:'',padrao:false}, paypal:{ativo:false,valor:'',padrao:false}, applepay:{ativo:false,valor:'',padrao:false}, googlepay:{ativo:false,valor:'',padrao:false} },
    dashboardCards:{ financeiro:true, operacional:true, fluxo:false, evolucao:false, eficiencia:false, geografico:false, destaques:true } };
  const METODOS_PAGAMENTO_META=[
    ['revolut','payment.method.revolut','@utilizador', 'https://api.iconify.design/simple-icons:revolut.svg'],
    ['iban','payment.method.iban','PT50 0000 0000 0000 0000 0000 0', 'https://api.iconify.design/mdi:bank.svg'],
    ['mbway','payment.method.mbway','+351 900 000 000', 'https://api.iconify.design/mdi:cellphone-android.svg'],
    ['paypal','payment.method.paypal','paypal.me/utilizador', 'https://api.iconify.design/ic:baseline-paypal.svg'],
    ['applepay','payment.method.applepay','@utilizador', 'https://api.iconify.design/cib:cc-apple-pay.svg'],
    ['googlepay','payment.method.googlepay','@utilizador', 'https://api.iconify.design/fa7-brands:google-pay.svg']
  ];
  function savePerfilData(){ savePersisted('pivot-perfilData', ()=>perfilData); }
  async function loadPerfilData(){
    const metodosPagamentoPadrao=perfilData.metodosPagamento;
    const dashboardCardsPadrao=perfilData.dashboardCards;
    await loadPersisted('pivot-perfilData', d=>{ perfilData=Object.assign({}, perfilData, d); });
    /* Object.assign acima é raso: se a conta foi guardada antes de um método
       de pagamento novo existir (ex.: Apple Pay/Google Pay), perfilData.metodosPagamento
       vem do banco sem essa chave — e por ser um objeto, ele substitui o
       default inteiro em vez de só preencher o que falta. Sem isto, o ecrã
       "Dados de pagamento" quebra ao tentar ler mp[key].ativo de uma chave
       que não existe. */
    perfilData.metodosPagamento=Object.assign({}, metodosPagamentoPadrao, perfilData.metodosPagamento);
    perfilData.dashboardCards=Object.assign({}, dashboardCardsPadrao, perfilData.dashboardCards);
    /* Migração única: limpa o antigo perfil de exemplo hardcoded ('Brener') guardado antes desta correção */
    if(perfilData.nome==='Brener' && perfilData.email==='brener@exemplo.pt'){
      perfilData.nome=''; perfilData.email=''; perfilData.empresa='';
      savePerfilData();
    }
    /* Migração única: contas guardadas antes da nova paleta de cores ficam presas
       na cor de marca antiga — atualiza para a cor de destaque atual da app. */
    if(perfilData.corMarca==='#14532D'){
      perfilData.corMarca='#295244';
      savePerfilData();
    }
    /* Migração única: sessões guardadas antes desta correção podem ter idiomaPortal
       desalinhado do idiomaUI sem nunca terem sido escolhidas explicitamente. */
    if(!perfilData.idiomaPortalCustom && perfilData.idiomaPortal!==perfilData.idiomaUI){
      perfilData.idiomaPortal=perfilData.idiomaUI;
      savePerfilData();
    }
    /* Migração única: 'Utilizador'/'Empresa Exemplo' eram valores fixos por defeito
       antes desta correção — passam a vazio para o placeholder reagir ao idioma. */
    if(perfilData.nome==='Utilizador') perfilData.nome='';
    if(perfilData.empresa==='Empresa Exemplo') perfilData.empresa='';
    /* Migração única: financeiro/operacional/destaques passaram a ficar visíveis
       por omissão em contas novas — contas antigas que os tinham gravados como false
       também devem recebê-los. _dashV2 evita re-forçar se o utilizador os desligar. */
    if(!perfilData._dashV2){
      perfilData.dashboardCards.financeiro=true;
      perfilData.dashboardCards.operacional=true;
      perfilData.dashboardCards.destaques=true;
      perfilData._dashV2=true;
      savePerfilData();
    }
    /* Sincronizar LANG com o idioma guardado */
    const langMap = {'Português':'pt','English':'en','Español':'es'};
    LANG = langMap[perfilData.idiomaUI] || 'pt';
    aplicarPerfilData();
    aplicarTraducaoCompleta();
  }
  /* Sobe uma imagem (já como data URL comprimido) para o bucket público
     public-assets e devolve o URL http estável. Path fixo por utilizador+nome
     (upsert) para o link não mudar a cada re-upload. Usado sempre que a
     imagem precisa de aparecer fora da app (ex.: emails) — data URIs em
     base64 funcionam dentro da app mas o Gmail e outros clientes bloqueiam
     <img src="data:..."> por segurança. */
  async function enviarImagemParaStorage(dataUrl, nomeBase){
    if(!currentUser) throw new Error('sem sessão');
    const blob = await (await fetch(dataUrl)).blob();
    const ext = (blob.type.split('/')[1]||'jpg').replace('jpeg','jpg');
    const path = currentUser.id+'/'+nomeBase+'.'+ext;
    const { error } = await sb.storage.from('public-assets').upload(path, blob, { upsert:true, contentType: blob.type });
    if(error) throw error;
    const { data } = sb.storage.from('public-assets').getPublicUrl(path);
    return data.publicUrl + '?v=' + Date.now();
  }
  async function onAvatarFileSelected(input){
    const file=input.files[0]; if(!file) return;
    try{
      const dataUrl=await arquivoParaDataUrlComprimido(file);
      perfilData.fotoUrl=await enviarImagemParaStorage(dataUrl, 'avatar');
      savePerfilData();
      aplicarPerfilData();
      showToast(t('toast.profilePhotoUpdated'));
    }catch(e){ showToast(t('toast.imageError')); }
    input.value='';
  }
  const PLANOS = {
    Free:       { labelKey:'plan.name.free',       descKey:'plan.desc.free' },
    Plus:       { labelKey:'plan.name.plus',       descKey:'plan.desc.plus' },
    Pro:        { labelKey:'plan.name.pro',        descKey:'plan.desc.pro' },
    Business:   { labelKey:'plan.name.business',   descKey:'plan.desc.business' },
    Enterprise: { labelKey:'plan.name.enterprise', descKey:'plan.desc.enterprise' }
  };
  function nomePlanoAtual(){ return t(PLANOS[perfilData.plano||'Free'].labelKey); }
  /* ===== Limites reais por plano — nunca cosméticos: o recurso continua
     visível e utilizável normalmente até ao limite; só a CRIAÇÃO de um novo
     item além do limite é bloqueada, com um modal a explicar o limite e um
     atalho direto para o upgrade (mesmo padrão já usado em
     LIMITE_UTILIZADORES_PLANO/abrirAdicionarMembro, só generalizado). */
  const LIMITE_TRABALHOS_PLANO={Free:3, Plus:15, Pro:50, Business:200, Enterprise:Infinity};
  const LIMITE_LISTAS_PLANO={Free:5, Plus:20, Pro:100, Business:500, Enterprise:Infinity};
  const LIMITE_MODELOS_PLANO={Free:2, Plus:8, Pro:30, Business:100, Enterprise:Infinity};
  const LIMITE_CLIENTES_PLANO={Free:5, Plus:30, Pro:150, Business:1000, Enterprise:Infinity};
  function abrirLimitePlanoModal(tituloKey, corpoKey, limite){
    const limiteTexto = limite===Infinity ? '∞' : limite;
    openInfo(t(tituloKey), `
      <p class="u-hint">${t(corpoKey).replace('{n}', limiteTexto)}</p>
      <button class="btn primary u-w-full" onclick="closeInfo();infoPlano()">${t('profile.account.plan')}</button>`);
  }
  function aplicarPerfilData(){
    const nomeExibido = perfilData.nome || t('defaults.userName');
    document.querySelectorAll('.p-name').forEach(el=>el.textContent=nomeExibido);
    document.querySelectorAll('.sb-profile .nm').forEach(el=>el.textContent=nomeExibido);
    document.querySelectorAll('.sb-profile .pl').forEach(el=>el.textContent=nomePlanoAtual());
    document.querySelectorAll('.p-sub').forEach(sub=>{ sub.textContent=(perfilData.empresa||t('defaults.companyName'))+' · '+nomePlanoAtual(); });
    const _dc=document.getElementById('drawer-company'); if(_dc) _dc.textContent=perfilData.empresa||t('defaults.companyName');
    const _dpb=document.getElementById('drawer-plan-badge'); if(_dpb) _dpb.textContent=nomePlanoAtual();
    const inicial=(nomeExibido||'U').charAt(0).toUpperCase();
    /* Só o avatar de perfil de verdade (.p-avatar-profile) — .p-avatar
       sozinho também é usado como preview de foto de contacto e de empresa,
       que têm as suas próprias imagens e nunca devem ser substituídas pela
       foto pessoal do utilizador. */
    document.querySelectorAll('.sb-avatar, .p-avatar-profile').forEach(el=>{
      if(perfilData.fotoUrl){
        el.textContent='';
        el.style.backgroundImage='url('+perfilData.fotoUrl+')';
        el.style.backgroundSize='cover'; el.style.backgroundPosition='center';
      } else {
        el.style.backgroundImage='none';
        el.textContent=inicial;
      }
    });
    aplicarIdiomaUI();
  }
  async function loadTarefasData(){ await loadPersisted('pivot-tarefasData', d=>{ tarefasData=d; }); }
  function populateTrabalhoSelects(){
    /* Só trabalhos ativos — jobsVisiveis() filtra só por permissão, nunca
       por estado, então concluídos/arquivados (job.arquivado ainda fica em
       jobsData, só sai da lista visível, pro histórico continuar a
       funcionar) apareciam aqui pra associar uma tarefa nova, o que não
       faz sentido pra um trabalho já fechado. */
    const optsReal=jobsVisiveis().filter(j=>!j.arquivado).map(j=>'<option value="'+j.id+'">'+escapeHtml(j.typeLabel+' — '+j.client)+'</option>').join('');
    ['ta-trabalho','ls-trabalho'].forEach(selId=>{
      const sel=document.getElementById(selId);
      if(sel) sel.innerHTML='<option value="">'+t('field.optionalDropdown')+'</option>'+optsReal;
    });
  }

  /* 👤 Cliente */
  let clienteDuplicadoEncontrado=null;
  function checkClienteDuplicado(){
    const v=document.getElementById('cl-email').value.trim().toLowerCase();
    clienteDuplicadoEncontrado = v ? (Object.values(clientesData).find(c=>c.email && c.email.toLowerCase()===v) || null) : null;
    document.getElementById('cl-dup').style.display = clienteDuplicadoEncontrado ? 'flex':'none';
    if(clienteDuplicadoEncontrado) document.getElementById('cl-dup-nome').textContent = clienteDuplicadoEncontrado.nome;
  }
  function usarClienteExistente(){
    if(!clienteDuplicadoEncontrado) return;
    closeSheet();
    showToast(t('toast.usingExistingClientPrefix')+clienteDuplicadoEncontrado.nome);
    ['cl-nome','cl-email','cl-tel','cl-empresa','cl-instagram','cl-obs'].forEach(i=>{ const el=document.getElementById(i); if(el) el.value=''; });
    document.getElementById('cl-dup').style.display='none';
    clienteDuplicadoEncontrado=null;
  }
  let contatoTipoAtual='Cliente';
  /* Não-nulo quando o painel "cliente" está a editar um contacto já
     existente (abrirEditarContato) em vez de criar um novo — o mesmo
     formulário serve pros dois casos, só muda o que criarCliente() faz ao
     confirmar (update em vez de insert) e o texto do botão/título. */
  let contatoEditandoId=null;
  function selecionarTipoContato(el){
    document.querySelectorAll('#cl-tipo-picker .priority-opt').forEach(o=>o.classList.remove('on'));
    el.classList.add('on');
    contatoTipoAtual=el.dataset.val;
  }
  /* Foto do contacto — mesma compressão em canvas usada nos documentos de
     escopo do colaborador (arquivoParaDataUrlComprimido), só que numa
     dimensão de thumb (240px) já que aqui só serve pra avatar, nunca pra
     visualização em tamanho grande. Guardada como data URL diretamente em
     clientesData (sem Supabase Storage) — ao contrário da foto de perfil,
     nunca é usada em emails, então não precisa de um URL público estável. */
  let clContatoFotoDataUrl=null;
  async function onContatoFotoSelecionada(input){
    const file=input.files[0]; if(!file) return;
    try{
      clContatoFotoDataUrl=await imagemComprimidaDataUrl(file, 240, 0.85);
      const preview=document.getElementById('cl-foto-preview');
      preview.style.backgroundImage='url('+clContatoFotoDataUrl+')';
      preview.style.backgroundSize='cover'; preview.style.backgroundPosition='center';
      preview.innerHTML='';
    }catch(e){ showToast(t('toast.imageError')); }
    input.value='';
  }
  function resetarFotoContatoForm(){
    clContatoFotoDataUrl=null;
    const preview=document.getElementById('cl-foto-preview');
    if(preview){
      preview.style.backgroundImage=''; preview.style.backgroundSize=''; preview.style.backgroundPosition='';
      preview.innerHTML='<svg class="u-sq-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
    }
  }
  function limparFormularioContato(){
    ['cl-nome','cl-email','cl-tel','cl-empresa','cl-instagram','cl-obs'].forEach(i=>{ const el=document.getElementById(i); if(el) el.value=''; });
    resetarFotoContatoForm();
    contatoTipoAtual='Cliente';
    contatoEditandoId=null;
    const picker=document.getElementById('cl-tipo-picker');
    if(picker){ picker.querySelectorAll('.priority-opt').forEach((o,i)=>o.classList.toggle('on', i===0)); }
    const btn=document.getElementById('cl-submit-btn');
    if(btn) btn.textContent=t('wizard.createContact');
  }
  /* Entrada do "+ Contato" — sempre parte de um formulário limpo. Sem isto,
     abrir "Contato" logo depois de ter usado "Editar" nalgum contacto (mesmo
     sem gravar) deixava o nome/foto/campos antigos por preencher no
     formulário do próximo contacto novo — o mesmo painel serve os dois
     fluxos, então o reset tem de acontecer sempre que se entra por aqui. */
  function abrirNovoContato(){
    limparFormularioContato();
    openSheet();
    pushPanel('cliente');
  }
  /* Abre o mesmo painel "cliente" (criar/editar são o mesmo formulário) já
     preenchido com os dados atuais do contacto. Se o contacto só existe por
     ter aparecido num trabalho/colaboração (nunca foi guardado à parte em
     clientesData), a edição cria o registo próprio na hora — sem isso não
     haveria onde gravar as alterações. */
  function abrirEditarContato(key){
    const sep=key.indexOf(':');
    const tipo=key.slice(0,sep), id=key.slice(sep+1);
    const c = tipo==='cli' ? (coletarClientes().find(x=>x.nome===id)||{nome:id}) : (coletarColaboradores().find(x=>(x.email||x.nome)===id)||{nome:id,email:id});
    const existente = Object.values(clientesData).find(x=>x.nome.toLowerCase()===(c.nome||'').toLowerCase());
    contatoEditandoId = existente ? existente.id : ('cli'+Date.now());
    openSheet();
    pushPanel('cliente');
    document.getElementById('cl-nome').value=c.nome||'';
    document.getElementById('cl-email').value=c.email||'';
    document.getElementById('cl-tel').value=c.telefone||'';
    document.getElementById('cl-empresa').value=c.empresa||'';
    document.getElementById('cl-instagram').value=c.instagram||'';
    document.getElementById('cl-obs').value=c.notas||'';
    contatoTipoAtual=c.tipo||'Cliente';
    document.getElementById('cl-tipo-picker').querySelectorAll('.priority-opt').forEach(o=>o.classList.toggle('on', o.dataset.val===contatoTipoAtual));
    clContatoFotoDataUrl=c.foto||null;
    const preview=document.getElementById('cl-foto-preview');
    if(c.foto){ preview.style.backgroundImage='url('+c.foto+')'; preview.style.backgroundSize='cover'; preview.style.backgroundPosition='center'; preview.innerHTML=''; }
    document.getElementById('cl-submit-btn').textContent=t('action.save');
  }
  function criarCliente(){
    const nomeEl=document.getElementById('cl-nome');
    const nome=nomeEl.value.trim();
    const err=document.getElementById('cl-nome-err');
    if(!nome){ err.style.display='block'; nomeEl.focus(); return; }
    err.style.display='none';
    const editando=!!contatoEditandoId;
    if(!editando){
      const limite=LIMITE_CLIENTES_PLANO[perfilData.plano||'Free'];
      if(Object.keys(clientesData).length>=limite){ abrirLimitePlanoModal('plan.limit.clientsTitle','plan.limit.clientsBody',limite); return; }
    }
    const id=contatoEditandoId||('cli'+Date.now());
    clientesData[id]={ id, nome, tipo:contatoTipoAtual||'Cliente',
      email:document.getElementById('cl-email').value.trim(),
      telefone:document.getElementById('cl-tel').value.trim(),
      empresa:document.getElementById('cl-empresa').value.trim(),
      instagram:document.getElementById('cl-instagram').value.trim(),
      notas:document.getElementById('cl-obs').value.trim(),
      foto:clContatoFotoDataUrl,
      criadoEm:(editando && clientesData[id] && clientesData[id].criadoEm) || new Date().toISOString() };
    saveClientesData();
    closeSheet();
    showToast(editando ? t('toast.contactUpdated') : (t('toast.contactCreated')+nome));
    limparFormularioContato();
    /* Depois de editar, volta pra lista em vez de tentar adivinhar a mesma
       key de detalhe — o tipo do contacto pode ter mudado no próprio
       formulário (ex.: Cliente → Colaborador), o que muda em qual aba/key
       ele passa a viver. */
    if(editando){ go('contatos'); renderContatos(); }
  }
