/* Pivots — colaboracoes
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== Colaborador Externo — partilha granular de parte de um trabalho
     com um utilizador já registado, sem lhe dar acesso ao workspace. Os
     dados partilhados vivem numa cópia própria (escopo), nunca no trabalho
     original — editar aqui não altera o trabalho real. ===== */
  const PERMISSOES_COLAB=[
    ['briefing','collab.perm.briefing'], ['checklist','collab.perm.checklist'], ['arquivos','collab.perm.files'],
    ['datas','collab.perm.dates'], ['horas','collab.perm.hours'], ['contrato','collab.perm.contract'], ['financeiro','collab.perm.financial']
  ];
  const NIVEIS_COLAB=[
    ['leitura','collab.level.read','collab.level.readDesc'],
    ['colaboracao','collab.level.collab','collab.level.collabDesc'],
    ['responsavel','collab.level.owner','collab.level.ownerDesc']
  ];
  function papelNomeColaborador(n){ return t(NIVEIS_COLAB.find(x=>x[0]===n)[1]); }
  const MODELOS_ACORDO={
    nda: {nomeKey:'collab.agreement.nda', texto:'Acordo de Não Divulgação — o Colaborador compromete-se a não divulgar nenhuma informação confidencial partilhada no âmbito deste trabalho.'},
    confidencialidade: {nomeKey:'collab.agreement.confidentiality', texto:'Acordo de Confidencialidade — toda a informação partilhada deve ser tratada como confidencial e não pode ser usada fora do âmbito deste trabalho.'},
    prestacao: {nomeKey:'collab.agreement.services', texto:'Acordo de Prestação de Serviços — o Colaborador presta os serviços especificados no âmbito deste trabalho, nos termos combinados com o profissional.'},
    personalizado: {nomeKey:'collab.agreement.custom', texto:''}
  };

  let colaboradoresCache={};
  async function carregarColaboradoresJob(jobId){
    const { data, error } = await sb.from('external_collaborators').select('*').eq('job_id', jobId).eq('workspace_id', currentWorkspaceId).neq('status','removido');
    colaboradoresCache[jobId] = error ? [] : (data||[]);
    renderSecaoColaboradoresExternos(jobId);
  }
  /* cada colaborador é um bloco vertical organizado — nome, função,
     permissão e status do contrato sempre em linhas próprias, nunca vários
     badges comprimidos lado a lado. Prioriza organização sobre economia de
     espaço (quebra em 2 linhas se precisar). */
  function renderSecaoColaboradoresExternos(jobId){
    const wrap=document.getElementById('colab-lista-'+jobId);
    if(!wrap) return;
    const lista=colaboradoresCache[jobId]||[];
    wrap.innerHTML = lista.length ? lista.map(c=>{
      const permissaoLabel = (PERMISSOES_CONTRATO_COLAB.find(x=>x[0]===(c.permissao||'leitor'))||[])[1];
      let campos='<div class="collab-field"><span class="k">'+t('collab.role')+'</span><span class="v'+(c.funcao?'':' muted')+'">'+(c.funcao?escapeHtml(c.funcao):t('collab.noRole'))+'</span></div>';
      if(permissaoLabel) campos+='<div class="collab-field"><span class="k">'+t('collab.permission')+'</span><span class="sig-tag gray">'+t(permissaoLabel)+'</span></div>';
      if(c.acordo && c.acordo.modelo) campos+='<div class="collab-field"><span class="k">'+t('collab.contractStatus')+'</span><span class="sig-tag '+(c.acordo.assinado?'green':'amber')+'">'+(c.acordo.assinado?t('collab.agreementSigned'):t('collab.agreementPending'))+'</span></div>';
      const acoes = (c.token ? '<svg class="u-ico-action u-flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="abrirReenviarAcessoColaborador(\''+c.id+'\',\''+jobId+'\')"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>' : '')+
        '<svg class="u-ico-action u-flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="removerColaboradorExterno(\''+c.id+'\',\''+jobId+'\')"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      return '<div class="collab-block">'+
        '<div class="collab-block-top"><div class="nm">'+escapeHtml(c.email)+'</div>'+
          '<div style="display:flex;gap:10px;flex:none">'+acoes+'</div>'+
        '</div>'+campos+
      '</div>';
    }).join('') : '<p class="u-label-nd">'+t('collab.none')+'</p>';
  }
  async function removerColaboradorExterno(id, jobId){
    const { error } = await sb.from('external_collaborators').update({status:'removido'}).eq('id',id);
    if(error){ showToast(t('toast.inviteError')); return; }
    await carregarColaboradoresJob(jobId);
    showToast(t('toast.personRemoved'));
  }
  /* O código de acesso só sai no email de convite original — se a pessoa o
     perder (ou o envio automático falhar), reenviar o mesmo email ou copiar
     link+código continua possível a qualquer momento, sem gerar um código
     novo (senão invalidava o que já foi usado noutro dispositivo). Mesmo
     padrão do "Copiar Acesso" do portal do cliente (construirMensagemPortalCliente). */
  function construirMensagemAcessoColaborador(c, jobNome){
    const link=window.location.origin+'/?colab='+c.token;
    const codigo=(c.escopo && c.escopo.codigoAcesso) || '';
    return t('portal.shareMessageGreeting')+'\n\n'+t('collab.shareMessageIntro').replace('{job}', jobNome)+'\n\n'+
      t('portal.shareMessageLinkLabel')+' '+link+'\n\n'+
      t('portal.shareMessageCodeLabel')+' '+codigo+'\n\n'+
      t('portal.shareMessageSecurity');
  }
  function abrirReenviarAcessoColaborador(id, jobId){
    const c=(colaboradoresCache[jobId]||[]).find(x=>x.id===id);
    if(!c) return;
    openInfo(t('collab.resendAccessTitle'), `
      <p class="u-hint">${t('collab.resendAccessHint')}</p>
      <button class="btn dark u-w-full u-mb-8" onclick="reenviarEmailAcessoColaborador('${id}','${jobId}')">${t('portal.resendEmail')}</button>
      <button class="btn dark u-w-full" onclick="abrirCopiarMensagemColaborador('${id}','${jobId}')">${t('portal.copyAccess')}</button>`);
  }
  async function reenviarEmailAcessoColaborador(id, jobId){
    const c=(colaboradoresCache[jobId]||[]).find(x=>x.id===id);
    const job=jobsData[jobId];
    if(!c || !job) return;
    const remetente = perfilData.nome||t('defaults.userName');
    const remetenteAvatarCor=avatarColor(remetente), remetenteIniciais=avatarInitials(remetente);
    const remetenteFoto = (perfilData.fotoUrl && !/^data:/i.test(perfilData.fotoUrl)) ? perfilData.fotoUrl : null;
    await enviarEmailConviteColaborador({semConta:true, email:c.email, jobNome:job.nome||job.typeLabel, remetente, remetenteAvatarCor, remetenteIniciais, remetenteFoto, token:c.token, codigo:(c.escopo&&c.escopo.codigoAcesso)});
    closeInfo();
    showToast(t('collab.emailSent'));
  }
  function abrirCopiarMensagemColaborador(id, jobId){
    const c=(colaboradoresCache[jobId]||[]).find(x=>x.id===id);
    const job=jobsData[jobId];
    if(!c || !job) return;
    const msg=construirMensagemAcessoColaborador(c, job.nome||job.typeLabel);
    openInfo(t('portal.copyAccess'), `
      <p class="u-sm-nd u-mb-8">${t('portal.editMessageHint')}</p>
      <textarea id="colab-msg-editavel" style="width:100%;min-height:170px;font-size:13px;font-family:inherit;padding:10px;border:1px solid var(--line);border-radius:var(--r);resize:vertical">${escapeHtml(msg)}</textarea>
      <button class="btn dark u-w-full u-mt-10" onclick="copiarMensagemColaboradorEditada()">${t('action.copyLink')}</button>`);
  }
  function copiarMensagemColaboradorEditada(){
    const texto=document.getElementById('colab-msg-editavel').value;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(texto).then(()=>{ showToast(t('toast.linkCopied')); closeInfo(); }).catch(()=>showToast(texto));
    } else { showToast(texto); }
  }

  /* ===== Contratos de Colaboradores =====
     Etapa de gestão interna: cada colaborador do trabalho tem Função (texto
     livre, ex. Fotógrafo/Editor), Permissão (Leitor/Editor/Administrador,
     todos começam Leitor) e um toggle Recebe Contrato. Aplicação em massa
     permite atribuir a mesma Função a vários colaboradores de uma vez e
     ligar Recebe Contrato para todos eles. */
  const PERMISSOES_CONTRATO_COLAB=[['leitor','collab.permLevel.reader'],['editor','collab.permLevel.editor'],['administrador','collab.permLevel.admin']];
  function abrirContratosColaboradores(jobId){
    const lista=colaboradoresCache[jobId]||[];
    if(!lista.length){ showToast(t('collab.none')); return; }
    openInfo(t('collab.contractsSection'), `
      <div id="contratos-colab-lista"></div>
      <button class="btn ghost u-w-full u-mt-10" onclick="abrirBibliotecaContratoColaboradoresMassa('${jobId}')">${t('collab.addContractForCollabs')}</button>`);
    renderContratosColaboradoresLista(jobId);
  }
  /* mesmo bloco vertical organizado do card Colaboradores (.collab-block/
     .collab-field) — nome no topo, cada campo na própria linha. */
  function renderContratosColaboradoresLista(jobId){
    const wrap=document.getElementById('contratos-colab-lista');
    if(!wrap) return;
    const lista=colaboradoresCache[jobId]||[];
    wrap.innerHTML = lista.map(c=>
      '<div class="collab-block">'+
        '<div class="collab-block-top"><div class="nm">'+escapeHtml(c.email)+'</div></div>'+
        '<div class="field u-m-0"><label class="u-xs-label">'+t('collab.role')+'</label><input value="'+escapeHtml(c.funcao||'')+'" placeholder="'+t('collab.rolePlaceholder')+'" onblur="salvarCampoColaborador(\''+jobId+'\',\''+c.id+'\',\'funcao\',this.value)"></div>'+
        '<div class="collab-field"><span class="k">'+t('collab.permission')+'</span><select onchange="salvarCampoColaborador(\''+jobId+'\',\''+c.id+'\',\'permissao\',this.value)">'+
          PERMISSOES_CONTRATO_COLAB.map(([key,labelKey])=>'<option value="'+key+'"'+((c.permissao||'leitor')===key?' selected':'')+'>'+t(labelKey)+'</option>').join('')+
        '</select></div>'+
        '<div class="collab-field"><span class="k">'+t('collab.receivesContract')+'</span><div class="toggle'+(c.recebe_contrato?' on':'')+'" onclick="this.classList.toggle(\'on\');salvarCampoColaborador(\''+jobId+'\',\''+c.id+'\',\'recebe_contrato\',this.classList.contains(\'on\'))"><div class="kn"></div></div></div>'+
      '</div>'
    ).join('');
  }
  async function salvarCampoColaborador(jobId, colabId, campo, valor){
    const { error } = await sb.from('external_collaborators').update({[campo]:valor}).eq('id',colabId);
    if(error){ showToast(t('toast.inviteError')); return; }
    const c=(colaboradoresCache[jobId]||[]).find(x=>x.id===colabId);
    if(c) c[campo]=valor;
    renderSecaoColaboradoresExternos(jobId);
  }
  /* Aplicação em massa usa a MESMA Biblioteca de Contratos: escolhe-se um
     modelo real (ex. "Contrato de Fotógrafo"), depois quem o recebe — nunca
     uma lista de texto solta. Repetível via "Adicionar Outro Contrato". */
  let modeloEscolhidoParaMassa=null;
  /* Escolher contrato pra colaborador usa a MESMA Biblioteca completa (tela
     "Modelos" — filtros de idioma/categoria/segmento, favoritos, ordenação)
     em vez de um painel reduzido dentro do sheet — não faz sentido manter
     duas interfaces pra explorar o mesmo catálogo. bibPickModeCallback
     guarda pra onde volta o contrato escolhido; abrirDetalheBibliotecaPrincipal
     já sabe rotear o botão Importar pra bibSelecionarParaDestino() quando
     está setado. */
  function abrirBibliotecaContratoColaboradoresMassa(jobId){
    bibPickModeCallback={modo:'colaboradorMassa', jobId};
    closeInfo();
    go('bibliotecas');
  }
  function textoDoModeloColaborador(job, modeloOrigem){
    return renderizarTextoModeloParaColaborador(job, modeloOrigem.blocks||[]);
  }
  function abrirAplicarContratoMassa(jobId, modeloOrigem){
    modeloEscolhidoParaMassa=modeloOrigem;
    const lista=colaboradoresCache[jobId]||[];
    openInfo(modeloOrigem.nome||t('collab.contractsSection'), `
      <p class="u-sm-nd u-mb-10">${t('collab.selectWhoReceives')}</p>
      <div id="bulk-colab-checklist">${lista.map(c=>
        '<label class="collab-select-row"><input type="checkbox" class="bulk-colab-check" value="'+c.id+'"><div class="info"><div class="nm">'+escapeHtml(c.email)+'</div>'+(c.funcao?'<div class="sub">'+escapeHtml(c.funcao)+'</div>':'')+'</div></label>'
      ).join('')}</div>
      <button class="btn primary u-w-full u-mt-12" onclick="aplicarContratoEmMassa('${jobId}')">${t('collab.apply')}</button>`);
  }
  async function aplicarContratoEmMassa(jobId){
    const ids=[...document.querySelectorAll('.bulk-colab-check:checked')].map(el=>el.value);
    if(!ids.length || !modeloEscolhidoParaMassa){ showToast(t('toast.writePersonName')); return; }
    const job=jobsData[jobId]||{};
    const texto=textoDoModeloColaborador(job, modeloEscolhidoParaMassa);
    const acordo={ modelo:'biblioteca', nome:modeloEscolhidoParaMassa.nome||null, texto, assinado:false };
    const { error } = await sb.from('external_collaborators').update({acordo, recebe_contrato:true}).in('id', ids);
    if(error){ showToast(t('toast.inviteError')); return; }
    /* BUG corrigido: aplicar o contrato só atualizava a base — ninguém era
       avisado de que havia um contrato novo à espera. Agora envia o mesmo
       email de notificação usado no resto do app (dispararEmailConta),
       um por colaborador selecionado. */
    const selecionados=(colaboradoresCache[jobId]||[]).filter(c=>ids.includes(c.id));
    const jobNome=job.nome||job.typeLabel;
    const remetente=perfilData.nome||t('defaults.userName');
    selecionados.forEach(c=>{
      const ctaUrl = c.token ? (window.location.origin+'/?colab='+c.token) : window.location.origin;
      dispararEmailConta('colaboradorContratoPronto', c.email, { nome:c.email, remetente, projeto:jobNome, ctaUrl }, true);
    });
    modeloEscolhidoParaMassa=null;
    await carregarColaboradoresJob(jobId);
    closeInfo();
    openInfo(t('collab.contractApplied'), `
      <p class="u-hint">${t('collab.contractAppliedHint')}</p>
      <button class="btn primary u-w-full u-mb-8" onclick="closeInfo();abrirBibliotecaContratoColaboradoresMassa('${jobId}')">${t('collab.addAnotherContract')}</button>
      <button class="btn ghost u-w-full" onclick="closeInfo();abrirContratosColaboradores('${jobId}')">${t('action.done')}</button>`);
  }

  let colabExternoEmailEncontrado=null, colabExternoNivel='leitura', colabExternoEscopo=null, colabExternoAcordo=null, colabExternoPermissoes={}, colabExternoFuncao='';
  async function abrirAdicionarColaboradorExterno(jobId){
    colabExternoEmailEncontrado=null; colabExternoNivel='leitura'; colabExternoEscopo=null; colabExternoAcordo=null; colabExternoPermissoes={}; colabExternoFuncao='';
    openInfo(t('collab.title'), `
      <p class="u-hint">${t('collab.searchHint')}</p>
      <div class="field"><label>${t('collab.nameOrEmail')}</label><input id="colab-email" placeholder="${t('collab.nameOrEmailPlaceholder')}" oninput="renderSugestoesColab('${jobId}')" autocomplete="off"></div>
      <div id="colab-sugestoes"></div>`);
    renderSugestoesColab(jobId);
    /* carrega o histórico de colaboradores (external_collaborators) para sugerir
       também quem já trabalhou contigo antes, não só a equipa atual */
    await carregarColabsExternosTodos();
    renderSugestoesColab(jobId);
  }
  /* fonte única das sugestões: equipa atual + histórico de colaboradores
     (external_collaborators + contactos do tipo Colaborador), deduplicado por email */
  function coletarColabSugestoes(){
    const mapa={};
    (membrosEquipa||[]).forEach(m=>{
      if(currentUser && m.user_id===currentUser.id) return;
      const k=(m.email||'').toLowerCase(); if(!k) return;
      mapa[k]={ nome:m.nome||m.email, email:m.email, userId:m.user_id, origem:'team' };
    });
    (colaboradoresExternosTodos||[]).forEach(c=>{
      const k=(c.email||'').toLowerCase(); if(!k || mapa[k]) return;
      mapa[k]={ nome:c.nome||c.email, email:c.email, userId:c.user_id||null, origem:'history' };
    });
    Object.values(clientesData).forEach(c=>{
      if((c.tipo||'Cliente')==='Cliente') return;
      const k=(c.email||'').toLowerCase(); if(!k || mapa[k]) return;
      mapa[k]={ nome:c.nome, email:c.email, userId:null, origem:'history' };
    });
    return Object.values(mapa);
  }
  function renderSugestoesColab(jobId){
    const wrap=document.getElementById('colab-sugestoes');
    if(!wrap) return;
    const q=(document.getElementById('colab-email').value||'').trim().toLowerCase();
    const ehEmail=/^\S+@\S+\.\S+$/.test(q);
    /* só sugere a partir de 3 letras — evita despejar todos os utilizadores da
       organização assim que o campo é focado, importante para organizações
       com dezenas ou centenas de pessoas */
    if(q.length<3 && !ehEmail){
      wrap.innerHTML='<p class="u-sm-nd u-p-6-2">'+t('collab.startTyping')+'</p>';
      return;
    }
    const todos=coletarColabSugestoes();
    const filtrados = todos.filter(c=>(c.email||'').toLowerCase().includes(q)||(c.nome||'').toLowerCase().includes(q));
    let html=filtrados.map(c=>{
      const tag = c.origem==='team' ? t('collab.fromTeam') : t('collab.fromHistory');
      return '<div class="pick-row" onclick="selecionarColabSugestao(\''+jobId+'\',\''+escapeHtml(c.email||'').replace(/'/g,"\\'")+'\',\''+(c.userId||'')+'\',\''+escapeHtml(c.nome||'').replace(/'/g,"\\'")+'\')">'+
        '<div><div class="nm">'+escapeHtml(c.nome||c.email||'')+'</div><span class="sub">'+escapeHtml(c.email||'')+' · '+tag+'</span></div></div>';
    }).join('');
    /* email completo digitado que não corresponde a ninguém → oferecer adicionar novo */
    const exato=todos.some(c=>(c.email||'').toLowerCase()===q);
    if(ehEmail && !exato){
      html+='<div class="pick-row" style="border:1px solid var(--brand);margin-top:6px" onclick="procurarColaboradorExterno(\''+jobId+'\')">'+
        '<div><div class="nm">'+t('collab.addNew')+'</div><span class="sub">'+escapeHtml(q)+'</span></div></div>';
    }
    if(!html) html='<p style="font-size:12.5px;color:var(--neutral);padding:6px 2px">'+t('wizard.noMatchesFor')+escapeHtml(q)+'"</p>';
    wrap.innerHTML=html;
  }
  function selecionarColabSugestao(jobId, email, userId, nome){
    colabExternoEmailEncontrado={ userId:userId||null, email, nome:nome||email };
    abrirConfigurarColaboradorExterno(jobId);
  }
  async function procurarColaboradorExterno(jobId){
    const el=document.getElementById('colab-email-externo')||document.getElementById('colab-email');
    const email=el.value.trim();
    if(!email || !email.includes('@')){ showToast(t('toast.writePersonName')); return; }
    const seguirSemConta=()=>{
      colabExternoEmailEncontrado={ userId:null, email, nome:email };
      abrirConfigurarColaboradorExterno(jobId);
    };
    try{
      const { data:sessionData } = await sb.auth.getSession();
      const access_token = sessionData && sessionData.session && sessionData.session.access_token;
      const res=await fetch('/api/team/lookup-user', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({access_token, email})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok || !body.exists){ seguirSemConta(); return; }
      colabExternoEmailEncontrado=body;
      abrirConfigurarColaboradorExterno(jobId);
    }catch(e){ seguirSemConta(); }
  }
  function abrirConfigurarColaboradorExterno(jobId){
    const u=colabExternoEmailEncontrado;
    const permissoesHtml=PERMISSOES_COLAB.map(([key,labelKey])=>
      '<div class="struct-row"><div class="struct-l"><div class="nm">'+t(labelKey)+'</div></div><div class="toggle'+(colabExternoPermissoes[key]?' on':'')+'" id="colab-perm-'+key+'" onclick="this.classList.toggle(\'on\');colabExternoPermissoes[\''+key+'\']=this.classList.contains(\'on\')"><div class="kn"></div></div></div>'
    ).join('');
    const niveisHtml=NIVEIS_COLAB.map(([key,labelKey,descKey])=>
      '<div class="pick-row'+(colabExternoNivel===key?' selected':'')+'" onclick="selecionarNivelColaborador(\''+key+'\',\''+jobId+'\')"><div><div class="nm">'+t(labelKey)+'</div><div class="sub">'+t(descKey)+'</div></div></div>'
    ).join('');
    openInfo(t('collab.title'), `
      <div class="struct-row u-mb-12"><div class="struct-l"><div class="nm">${escapeHtml(u.nome||u.email)}</div><span class="sub">${escapeHtml(u.email)}</span></div></div>
      <div class="field"><label>${t('collab.role')} *</label><input id="colab-funcao" placeholder="${t('collab.rolePlaceholder')}" value="${escapeHtml(colabExternoFuncao)}" oninput="colabExternoFuncao=this.value"></div>
      <p class="plabel" style="margin:6px 2px 9px">${t('collab.permissionsTitle')}</p>
      ${permissoesHtml}
      <p class="plabel" style="margin:16px 2px 9px">${t('collab.levelTitle')}</p>
      ${niveisHtml}
      ${jobId==='__wizard__' ? '' : '<button class="btn ghost u-w-full u-mt-14" onclick="abrirEscopoColaboradorExterno(\''+jobId+'\')">'+t('collab.customizeScope')+'</button>'}
      <button class="btn ghost u-w-full u-mt-8" onclick="abrirAcordoColaboradorExterno('${jobId}')">${t('collab.agreementOptional')}</button>
      <button class="btn primary u-w-full u-mt-14" onclick="convidarColaboradorExterno('${jobId}')">${t('collab.invite')}</button>`);
  }
  function selecionarNivelColaborador(nivel, jobId){ colabExternoNivel=nivel; abrirConfigurarColaboradorExterno(jobId); }
  function escopoBaseColaborador(job, jobId){
    return colabExternoEscopo || {
      horasPrevistas: job.duracaoHoras || (job.servico&&job.servico.horas) || null,
      checklist: job.checklist ? job.checklist.itens.map(c=>({t:c.t, feito:false})) : [],
      tarefas: Object.values(tarefasData).filter(tk=>tk.jobId===jobId).map(tk=>({id:tk.id, titulo:tk.titulo, feito:false})),
      documentos: []
    };
  }
  function abrirEscopoColaboradorExterno(jobId){
    const job=jobsData[jobId];
    colabExternoEscopo=escopoBaseColaborador(job, jobId);
    renderEscopoColaboradorExterno(jobId);
  }
  function renderEscopoColaboradorExterno(jobId){
    const esc=colabExternoEscopo;
    openInfo(t('collab.customizeScope'), `
      <div class="field"><label>${t('collab.hoursForThisPerson')}</label><input type="number" id="colab-escopo-horas" value="${esc.horasPrevistas||''}"></div>
      <p class="plabel u-m-14-2-9">${t('wizard.model.checklist')}</p>
      <div>${esc.checklist.map((c,i)=>'<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(c.t)+'</div></div><svg class="u-ico-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="removerItemEscopoChecklist('+i+',\''+jobId+'\')"><path d="M18 6 6 18M6 6l12 12"/></svg></div>').join('') || '<p class="u-sm-nd">—</p>'}</div>
      <p class="plabel u-m-14-2-9">${t('cost.tasks')}</p>
      <div>${esc.tarefas.map((tk,i)=>'<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(tk.titulo)+'</div></div><svg class="u-ico-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="removerItemEscopoTarefa('+i+',\''+jobId+'\')"><path d="M18 6 6 18M6 6l12 12"/></svg></div>').join('') || '<p class="u-sm-nd">—</p>'}</div>
      <p class="plabel u-m-14-2-9">${t('collab.perm.files')}</p>
      <div id="colab-escopo-docs">${esc.documentos.map((d,i)=>'<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(d.nome)+'</div></div><svg class="u-ico-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="removerItemEscopoDoc('+i+',\''+jobId+'\')"><path d="M18 6 6 18M6 6l12 12"/></svg></div>').join('')}</div>
      <div class="field"><input type="file" id="colab-escopo-file-input" onchange="adicionarDocEscopo(this,'${jobId}')"></div>
      <button class="btn primary u-w-full u-mt-10" onclick="guardarEscopoColaboradorExterno('${jobId}')">${t('action.save')}</button>`);
  }
  function removerItemEscopoChecklist(i,jobId){ colabExternoEscopo.checklist.splice(i,1); renderEscopoColaboradorExterno(jobId); }
  function removerItemEscopoTarefa(i,jobId){ colabExternoEscopo.tarefas.splice(i,1); renderEscopoColaboradorExterno(jobId); }
  function removerItemEscopoDoc(i,jobId){ colabExternoEscopo.documentos.splice(i,1); renderEscopoColaboradorExterno(jobId); }
  async function adicionarDocEscopo(input, jobId){
    const file=input.files[0]; if(!file) return;
    try{
      const dataUrl=await arquivoParaDataUrlComprimido(file);
      colabExternoEscopo.documentos.push({nome:file.name, dataUrl});
      renderEscopoColaboradorExterno(jobId);
    }catch(e){ showToast(t('toast.imageError')); }
  }
  function guardarEscopoColaboradorExterno(jobId){
    colabExternoEscopo.horasPrevistas=parseFloat(document.getElementById('colab-escopo-horas').value)||null;
    showToast(t('toast.settingsSaved'));
    abrirConfigurarColaboradorExterno(jobId);
  }
  /* O contrato do colaborador usa a MESMA Biblioteca de Contratos do resto
     do app — nunca os botões de texto NDA/Prestação/Personalizado. Depois
     de escolher um modelo, o texto renderizado (mesmo motor dos contratos
     de trabalho) fica em colabExternoAcordo.texto, reaproveitando toda a
     assinatura já existente (assinarAcordoColabPublico etc.), que só olha
     para texto/assinado — nunca para o "modelo" ter vindo do MODELOS_ACORDO. */
  let contratoParaColaboradorJobId=null;
  function abrirAcordoColaboradorExterno(jobId){
    if(!colabExternoAcordo) colabExternoAcordo={modelo:null, nome:null, texto:''};
    if(colabExternoAcordo.texto){
      openInfo(t('collab.agreementOptional'), `
        <div class="struct-row"><div class="struct-l"><div class="nm">${escapeHtml(colabExternoAcordo.nome||t('collab.agreement.custom'))}</div></div></div>
        <p style="font-size:12.5px;color:var(--ink-soft);white-space:pre-wrap;max-height:180px;overflow-y:auto;margin:10px 0">${escapeHtml(colabExternoAcordo.texto)}</p>
        <button class="btn soft u-w-full u-mb-8" onclick="abrirSelecionarContratoColaborador('${jobId}')">${t('collab.changeContract')}</button>
        <button class="btn ghost u-w-full" onclick="colabExternoAcordo=null;abrirConfigurarColaboradorExterno('${jobId}')">${t('action.remove')}</button>`);
      return;
    }
    abrirSelecionarContratoColaborador(jobId);
  }
  function abrirSelecionarContratoColaborador(jobId){
    /* __wizard__ = a meio da criação do trabalho (o job ainda não existe,
       não há pra onde "voltar" fora do sheet) — mantém o painel reduzido
       dentro do próprio sheet do assistente. Job já existente (Portal
       Operacional) = usa a Biblioteca completa (tela "Modelos"), mesma
       interface rica de sempre, sem duplicar UI. */
    if(jobId==='__wizard__'){
      contratoParaColaboradorJobId=jobId;
      twEmWizard=false;
      abrirPainelBibliotecaContratoDireto();
      return;
    }
    bibPickModeCallback={modo:'colaborador', jobId};
    closeInfo();
    go('bibliotecas');
  }
  function renderizarTextoModeloParaColaborador(job, blocks){
    return blocks.filter(b=>b.on!==false).map(b=>blockName(b)+'\n'+blockText(job,b)).join('\n\n');
  }
  function aplicarContratoEscolhidoAoColaborador(jobId, modeloOrigem){
    const job=jobsData[jobId] || {};
    colabExternoAcordo = { modelo:'biblioteca', nome:modeloOrigem.nome||null, texto: textoDoModeloColaborador(job, modeloOrigem), assinado:false };
    abrirConfigurarColaboradorExterno(jobId);
  }
  async function convidarColaboradorExterno(jobId){
    const u=colabExternoEmailEncontrado;
    if(!u){ showToast(t('toast.inviteError')); return; }
    const funcaoEl=document.getElementById('colab-funcao');
    const funcao=(funcaoEl?funcaoEl.value:colabExternoFuncao).trim();
    if(!funcao){ if(funcaoEl) funcaoEl.focus(); showToast(t('collab.roleRequired')); return; }
    const permissoes={};
    PERMISSOES_COLAB.forEach(([key])=>{ permissoes[key]=!!colabExternoPermissoes[key]; });
    if(jobId==='__wizard__'){
      // O trabalho ainda não existe (estamos no assistente de criação) — guarda a
      // configuração e só cria o registo real depois do trabalho ser criado.
      twColaboradoresExternosPendentes.push({ email:u.email, nome:u.nome||u.email, userId:u.userId, nivel_acesso:colabExternoNivel, permissoes, acordo:colabExternoAcordo, funcao });
      colabExternoEmailEncontrado=null; colabExternoEscopo=null; colabExternoAcordo=null; colabExternoNivel='leitura'; colabExternoFuncao='';
      closeInfo();
      // Se o utilizador passou pela biblioteca de contratos (Contrato de
      // Colaborador), a folha pode ter ficado no painel da biblioteca —
      // garantir que volta à Etapa 2 do wizard, não onde a biblioteca ficou.
      while(panelStack.length>1 && panelStack[panelStack.length-1]!=='trabalho'){ panelStack.pop(); }
      showPanel('trabalho');
      if(trabalhoMoment!==2) trabalhoGoto(2); else renderColaboradorExternoPendenteWizard();
      return;
    }
    const job=jobsData[jobId];
    const escopo=escopoBaseColaborador(job, jobId);
    const briefing = permissoes.briefing && job.briefing ? {perguntas:job.briefing.perguntas||[], observacoes:job.briefing.observacoes||''} : null;
    const datas = permissoes.datas ? {date:job.date, local:job.local} : null;
    const contrato = permissoes.contrato && job.contract ? {status:job.contract.status} : null;
    const financeiro = permissoes.financeiro ? {value:job.value, payments:(job.payments||[]).map(p=>({label:p.label, amount:p.amount, status:p.status}))} : null;
    if(!permissoes.checklist) escopo.checklist=[];
    if(!permissoes.arquivos) escopo.documentos=[];
    if(!permissoes.horas) escopo.horasPrevistas=null;
    const semConta = !u.userId;
    const token = semConta ? gerarTokenColaborador() : null;
    const codigo = semConta ? gerarCodigoAcessoPortal() : null;
    const row={
      workspace_id: currentWorkspaceId, job_id: jobId, user_id: u.userId, email: u.email, token,
      nivel_acesso: colabExternoNivel, permissoes, funcao, recebe_contrato: !!(colabExternoAcordo && colabExternoAcordo.texto),
      escopo: Object.assign({}, escopo, {briefing, datas, contrato, financeiro, jobNome: job.nome||job.typeLabel, jobCliente: job.client, codigoAcesso: codigo}),
      /* Sempre 'convidado' — mesmo já tendo conta Pivots, a pessoa só passa a
         ver o trabalho depois de aceitar o convite (ver aceitarColaboracaoExterna),
         nunca automaticamente. */
      acordo: colabExternoAcordo, entregas: [], status:'convidado'
    };
    const { error } = await sb.from('external_collaborators').insert(row);
    if(error){ console.error(error); showToast(t('toast.inviteError')); return; }
    colabExternoEmailEncontrado=null; colabExternoEscopo=null; colabExternoAcordo=null; colabExternoNivel='leitura'; colabExternoFuncao='';
    closeInfo();
    await carregarColaboradoresJob(jobId);
    const jobNome = job.nome||job.typeLabel;
    const remetente = perfilData.nome||t('defaults.userName');
    const remetenteAvatarCor=avatarColor(remetente), remetenteIniciais=avatarInitials(remetente);
    const remetenteFoto = (perfilData.fotoUrl && !/^data:/i.test(perfilData.fotoUrl)) ? perfilData.fotoUrl : null;
    await enviarEmailConviteColaborador({semConta, email:u.email, jobNome, remetente, remetenteAvatarCor, remetenteIniciais, remetenteFoto, token, codigo});
    if(semConta){
      const link=window.location.origin+'/?colab='+token;
      openInfo(t('collab.invited'), `
        <p class="u-hint-bare u-mb-12">${t('collab.emailSent')}</p>
        <div class="field"><label>${t('collab.linkHint')}</label><input readonly value="${escapeHtml(link)}" onclick="this.select()"></div>
        <p style="font-size:12.5px;color:var(--neutral);margin-top:10px">${t('collab.codeHintOwner').replace('{codigo}', codigo)}</p>
        <button class="btn primary u-w-full u-mt-10" onclick="navigator.clipboard.writeText('${link}');showToast(t('toast.linkCopied'))">${t('action.copyLink')}</button>`);
    } else {
      showToast(t('collab.notifiedInApp'));
    }
  }
  function gerarTokenColaborador(){ return (crypto.randomUUID?crypto.randomUUID():Math.random().toString(36)).replace(/-/g,''); }
  /* Convite de colaborador — dois caminhos: quem já tem conta Pivots recebe
     um convite para aceitar dentro da app (ver aceitarColaboracaoExterna);
     quem não tem recebe um link de portal (?colab=token) + um código de
     acesso de 6 dígitos por email, igual ao portal do cliente — sem o
     código, o link sozinho não mostra nada (ver colab_get no Supabase). */
  async function enviarEmailConviteColaborador({semConta, email, jobNome, remetente, remetenteAvatarCor, remetenteIniciais, remetenteFoto, token, codigo}){
    if(semConta){
      const link=window.location.origin+'/?colab='+token;
      await dispararEmailConta('colaboradorJobConvite', email, { remetente, projeto:jobNome, ctaUrl:link, codigo }, true);
    } else {
      await dispararEmailConta('colaboradorJobAdicionado', email, { remetente, projeto:jobNome, email, ctaUrl:window.location.origin }, true);
    }
  }

  /* ===== Área do próprio colaborador externo =====
     Quem já tem conta Pivots nunca entra automaticamente num trabalho —
     fica em status 'convidado' até aceitar aqui (aceitarColaboracaoExterna),
     tal como quem não tem conta só entra depois de confirmar o código de
     acesso no portal público (?colab=token). */
  let minhasColaboracoesExternas=[];
  async function carregarMinhasColaboracoes(){
    if(!currentUser) return;
    const { data, error } = await sb.from('external_collaborators').select('*').eq('user_id', currentUser.id).in('status',['ativo','convidado']);
    minhasColaboracoesExternas = error ? [] : (data||[]);
    const navItem=document.getElementById('sb-item-colaboracoes');
    if(navItem) navItem.style.display = minhasColaboracoesExternas.length ? 'flex' : 'none';
  }
  function renderColaboracoesView(){
    const wrap=document.getElementById('colaboracoes-lista');
    if(!wrap) return;
    wrap.innerHTML = minhasColaboracoesExternas.length ? minhasColaboracoesExternas.map(c=>{
      const pendente = c.status==='convidado';
      const info = '<div><div class="job-client">'+escapeHtml((c.escopo&&c.escopo.jobCliente)||'')+'</div><div class="job-type">'+escapeHtml((c.escopo&&c.escopo.jobNome)||'')+' · '+papelNomeColaborador(c.nivel_acesso)+'</div></div>';
      if(pendente){
        return '<div class="job"><div class="job-top">'+info+'<span class="collab-pending-tag">'+t('collab.pendingTag')+'</span></div>'+
          '<div style="display:flex;gap:8px;margin-top:10px">'+
          '<button class="btn primary u-flex-1" onclick="event.stopPropagation();aceitarColaboracaoExterna(\''+c.id+'\')">'+t('collab.accept')+'</button>'+
          '<button class="btn ghost u-flex-1" onclick="event.stopPropagation();recusarColaboracaoExterna(\''+c.id+'\')">'+t('collab.decline')+'</button>'+
          '</div></div>';
      }
      return '<div class="job" onclick="abrirColaboracaoExterna(\''+c.id+'\')"><div class="job-top">'+info+'</div></div>';
    }).join('') : '<p class="u-label-nd">'+t('collab.noneAssigned')+'</p>';
  }
  async function aceitarColaboracaoExterna(id){
    const { error } = await sb.from('external_collaborators').update({status:'ativo'}).eq('id',id);
    if(error){ showToast(t('toast.inviteError')); return; }
    showToast(t('collab.acceptedToast'));
    await carregarMinhasColaboracoes();
    renderColaboracoesView();
  }
  async function recusarColaboracaoExterna(id){
    const { error } = await sb.from('external_collaborators').update({status:'removido'}).eq('id',id);
    if(error){ showToast(t('toast.inviteError')); return; }
    showToast(t('collab.declinedToast'));
    await carregarMinhasColaboracoes();
    renderColaboracoesView();
  }
  function abrirColaboracaoExterna(id){
    const c=minhasColaboracoesExternas.find(x=>x.id===id);
    if(!c || c.status!=='ativo') return;
    if(c.acordo && c.acordo.modelo && !c.acordo.assinado){ renderAssinarAcordoColaboracao(c); return; }
    renderDetalheColaboracaoExterna(c);
  }
  function renderAssinarAcordoColaboracao(c){
    openInfo(t('collab.agreementTitle'), `
      <p style="font-size:13px;color:var(--ink-soft);white-space:pre-wrap;margin-bottom:14px;max-height:200px;overflow-y:auto">${escapeHtml(c.acordo.texto||'')}</p>
      <div class="field"><label>${t('field.name')}</label><input id="colab-assinar-nome" placeholder="${t('field.name')}"></div>
      <div class="sig-pad-wrap"><canvas id="sig-canvas"></canvas><span class="sig-pad-clear" onclick="limparAssinaturaCanvas()">${t('signature.clear')}</span></div>
      <button class="btn primary u-w-full u-mt-10" onclick="assinarAcordoColaboracao('${c.id}')">${t('collab.signAndAccess')}</button>`);
    setTimeout(inicializarCanvasAssinatura, 30);
  }
  async function assinarAcordoColaboracao(id){
    const nome=document.getElementById('colab-assinar-nome').value.trim();
    if(!nome){ alert(t('toast.writePersonName')); return; }
    const canvas=document.getElementById('sig-canvas');
    if(!canvas || !sigHasDrawing){ alert(t('toast.drawSignatureFirst')); return; }
    const c=minhasColaboracoesExternas.find(x=>x.id===id);
    const acordo=Object.assign({}, c.acordo, {assinado:true, assinadoEm:new Date().toISOString(), signerName:nome, assinaturaImg:canvas.toDataURL('image/png')});
    const { error } = await sb.from('external_collaborators').update({acordo}).eq('id',id);
    if(error){ showToast(t('toast.inviteError')); return; }
    c.acordo=acordo;
    closeInfo();
    renderDetalheColaboracaoExterna(c);
  }
  function renderDetalheColaboracaoExterna(c){
    const e=c.escopo||{};
    let html='<h3 style="margin:0 0 4px">'+escapeHtml(e.jobNome||'')+'</h3><p class="u-label-soft u-m-016">'+escapeHtml(e.jobCliente||'')+'</p>';
    if(e.briefing){
      html+='<p class="plabel">'+t('job.clientInfo')+'</p>'+(e.briefing.perguntas||[]).map(p=>'<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(p.q)+'</div></div><span class="u-sm">'+escapeHtml(p.r||'')+'</span></div>').join('');
      if(e.briefing.observacoes) html+='<p style="font-size:13px;color:var(--ink-soft);margin-top:6px">'+escapeHtml(e.briefing.observacoes)+'</p>';
    }
    if(e.datas) html+='<p class="plabel u-mt-14">'+t('email.detail.date')+'</p><p class="u-label">'+escapeHtml(e.datas.date||'')+(e.datas.local?(' · '+escapeHtml(e.datas.local)):'')+'</p>';
    if(e.horasPrevistas) html+='<p class="plabel u-mt-14">'+t('collab.perm.hours')+'</p><p class="u-label">'+e.horasPrevistas+'h</p>';
    if(e.checklist && e.checklist.length){
      html+='<p class="plabel u-mt-14">'+t('wizard.model.checklist')+'</p>'+e.checklist.map((ck,i)=>
        '<div class="struct-row"><div class="struct-l"><div class="nm" style="'+(ck.feito?'text-decoration:line-through;color:var(--neutral)':'')+'">'+escapeHtml(ck.t)+'</div></div>'+
        (c.nivel_acesso==='responsavel'?'<div class="toggle'+(ck.feito?' on':'')+'" onclick="toggleChecklistColaboracao(\''+c.id+'\','+i+')"><div class="kn"></div></div>':'')+'</div>'
      ).join('');
    }
    if(e.tarefas && e.tarefas.length){
      html+='<p class="plabel u-mt-14">'+t('cost.tasks')+'</p>'+e.tarefas.map((tk,i)=>
        '<div class="struct-row"><div class="struct-l"><div class="nm" style="'+(tk.feito?'text-decoration:line-through;color:var(--neutral)':'')+'">'+escapeHtml(tk.titulo)+'</div></div>'+
        (c.nivel_acesso==='responsavel'?'<div class="toggle'+(tk.feito?' on':'')+'" onclick="toggleTarefaColaboracao(\''+c.id+'\','+i+')"><div class="kn"></div></div>':'')+'</div>'
      ).join('');
    }
    if(e.documentos && e.documentos.length){
      html+='<p class="plabel u-mt-14">'+t('collab.perm.files')+'</p>'+e.documentos.map(d=>'<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(d.nome||'')+'</div></div></div>').join('');
    }
    if(e.contrato) html+='<p class="plabel u-mt-14">'+t('job.contract')+'</p><p class="u-label">'+escapeHtml(e.contrato.status||'')+'</p>';
    if(e.financeiro) html+='<p class="plabel u-mt-14">'+t('collab.perm.financial')+'</p>'+(e.financeiro.payments||[]).map(p=>'<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(p.label)+'</div></div><span class="u-label">'+fmtMoney(p.amount)+'</span></div>').join('');
    if(c.nivel_acesso!=='leitura'){
      html+='<p class="plabel u-mt-18">'+t('collab.deliveries')+'</p><div>'+
        (c.entregas||[]).map(en=>'<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(en.tipo)+'</div><span class="sub">'+escapeHtml(en.observacoes||'')+'</span></div></div>').join('')+'</div>'+
        '<div style="display:flex;gap:8px;margin-top:8px">'+
        '<button class="btn ghost u-flex-1" onclick="abrirNovaEntregaColaboracao(\''+c.id+'\',\'link\')">Link</button>'+
        '<button class="btn ghost u-flex-1" onclick="abrirNovaEntregaColaboracao(\''+c.id+'\',\'arquivo\')">'+t('collab.perm.files')+'</button></div>';
    }
    openInfo(e.jobNome||t('nav.collaborations'), html);
  }
  function toggleChecklistColaboracao(id,i){
    const c=minhasColaboracoesExternas.find(x=>x.id===id);
    c.escopo.checklist[i].feito=!c.escopo.checklist[i].feito;
    sb.from('external_collaborators').update({escopo:c.escopo}).eq('id',id).then(()=>renderDetalheColaboracaoExterna(c));
  }
  function toggleTarefaColaboracao(id,i){
    const c=minhasColaboracoesExternas.find(x=>x.id===id);
    c.escopo.tarefas[i].feito=!c.escopo.tarefas[i].feito;
    sb.from('external_collaborators').update({escopo:c.escopo}).eq('id',id).then(()=>renderDetalheColaboracaoExterna(c));
  }
  function abrirNovaEntregaColaboracao(id, tipo){
    openInfo(t('collab.newDelivery'), `
      ${tipo==='link' ? '<div class="field"><label>Link</label><input id="colab-entrega-valor" placeholder="https://..."></div>' : '<div class="field"><label>'+t('collab.perm.files')+'</label><input type="file" id="colab-entrega-file"></div>'}
      <div class="field"><textarea id="colab-entrega-obs" placeholder="${t('portal.notesPlaceholder')}"></textarea></div>
      <button class="btn primary u-w-full" onclick="guardarEntregaColaboracao('${id}','${tipo}')">${t('action.add')}</button>`);
  }
  async function guardarEntregaColaboracao(id, tipo){
    const c=minhasColaboracoesExternas.find(x=>x.id===id);
    const obs=document.getElementById('colab-entrega-obs').value.trim();
    let valor='';
    if(tipo==='link'){
      valor=document.getElementById('colab-entrega-valor').value.trim();
    } else {
      const file=document.getElementById('colab-entrega-file').files[0];
      if(file) valor=await arquivoParaDataUrlComprimido(file);
    }
    c.entregas=c.entregas||[];
    c.entregas.push({tipo, valor, observacoes:obs, criadoEm:new Date().toISOString()});
    const { error } = await sb.from('external_collaborators').update({entregas:c.entregas}).eq('id',id);
    if(error){ showToast(t('toast.inviteError')); return; }
    showToast(t('collab.deliverySaved'));
    renderDetalheColaboracaoExterna(c);
  }
