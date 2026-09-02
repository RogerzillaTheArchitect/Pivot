/* Pivots — criar router
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== Resumo do dia — Pagamentos pendentes / Próximas entregas / Trabalhos recentes ===== */

  /* ===== Custos — planeamento financeiro manual e real ===== */
  let custosData={};
  function saveCustosData(){ savePersisted('pivot-custosData', ()=>custosData); }
  async function loadCustosData(){
    await loadPersisted('pivot-custosData', d=>{ custosData=d; });
    renderMonthTicker();
  }
  function custosDoMes(anoParam, mesParam){
    const hoje=new Date(); const ano=anoParam!=null?anoParam:hoje.getFullYear(), mes=mesParam!=null?mesParam:hoje.getMonth()+1;
    return Object.values(custosData).filter(c=>{
      if(!c.data) return true;
      const [y,m]=c.data.split('-').map(Number);
      return y===ano && m===mes;
    }).reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
  }
  /* mantido como alias — o painel de despesas passou a ser abrirDespesas() */
  function removerCusto(id){
    delete custosData[id];
    saveCustosData();
    renderMonthTicker();
    if(document.getElementById('infoSheet').classList.contains('show') && document.getElementById('exp-lista')) renderDespesasLista();
    if(document.getElementById('v-hoje').classList.contains('active')) renderRelatorios();
    showToast(t('toast.costRemoved'));
  }

  function staggerCards(selector){
    const els=[...document.querySelectorAll(selector)].filter(el=>el.style.display!=='none');
    els.forEach((el,i)=>{
      el.style.animation='none';
      void el.offsetWidth;
      el.style.animation='fade .38s ease both';
      el.style.animationDelay=(i*0.045)+'s';
    });
  }

  function openJob(id){
    if(!jobsData[id]) return;
    currentJobId=id;
    document.getElementById('detalhe-dynamic').style.display='block';
    if(typeof _atualizarIndicadorNotas==='function') _atualizarIndicadorNotas(id);
    try{
      renderJobDetailDynamic(id);
    }catch(e){
      console.error('Erro ao abrir trabalho', id, e);
      openInfo(t('toast.jobNotFound')||'Erro', '<p class="u-label-soft">Não foi possível abrir este trabalho. Detalhe técnico: '+escapeHtml(String(e && e.message || e))+'</p><button class="btn soft u-w-full u-mt-12" onclick="closeInfo()">Fechar</button>');
      return;
    }
    go('detalhe');
  }
  /* Edição rápida das informações principais do trabalho, acessível pelo rodapé
     da página de detalhe (Arquivar/Editar/Concluir). Só os campos simples de
     texto (cliente, tipo, local) — data/valor têm formulários e formatações
     próprias noutros pontos do app, editar por aqui arriscaria dessincronizar
     dateRaw/date ou o cálculo de recorrência. */
  function abrirEditarInfoTrabalho(){
    const job=jobsData[currentJobId]; if(!job) return;
    const html='<div class="field"><label data-t="field.client">Cliente</label><input id="job-edit-client" value="'+escapeHtml(job.client||'')+'"></div>'+
      '<div class="field"><label data-t="field.type">Tipo de trabalho</label><input id="job-edit-type" value="'+escapeHtml(job.typeLabel||'')+'"></div>'+
      '<div class="field"><label data-t="field.local">Local</label><input id="job-edit-local" value="'+escapeHtml(job.local||'')+'"></div>'+
      '<button class="btn primary u-w-full u-mt-8" onclick="salvarEditarInfoTrabalho()">'+t('reports.saveExpense')+'</button>';
    openInfo(t('job.editInfoTitle'), html);
  }
  function salvarEditarInfoTrabalho(){
    const job=jobsData[currentJobId]; if(!job) return;
    const client=(document.getElementById('job-edit-client').value||'').trim();
    const typeLabel=(document.getElementById('job-edit-type').value||'').trim();
    const local=(document.getElementById('job-edit-local').value||'').trim();
    if(!client || !typeLabel){ showToast(t('toast.fillDescValue')); return; }
    job.client=client; job.typeLabel=typeLabel; job.local=local;
    saveJobsData();
    closeInfo();
    renderJobDetailDynamic(currentJobId);
    const cardEl=document.querySelector('.job[data-job-id="'+currentJobId+'"]');
    if(cardEl) updateJobCardInner(cardEl, job);
    showToast(t('toast.jobUpdated'));
  }

  /* updateHoje() saiu — mostrava "Está tudo em dia." (#hoje-empty)
     contando .tsk-card (a antiga pilha), duplicando a mensagem vazia que
     cada pill agora já mostra sozinha (.tsk-row-empty dentro de
     #tasks-list, contextual à pill ativa — "nada em Lembretes" é
     diferente de "nada em Agenda"). #nav-badge/#hoje-content nunca
     existiram no HTML, eram referências mortas já antes disto. */

  function openClient(){
    if(!jobsData[currentJobId]) return;
    const syncRow=document.getElementById('cw-cal-sync-row');
    clientContext=currentJobId;
    document.getElementById('client-dynamic').style.display='block';
    document.getElementById('cw-tag').textContent=t('portal.clientViewReal');
    renderClientDynamic(currentJobId);
    syncRow.style.display='flex';
    document.getElementById('clientwrap').classList.add('show');
    atualizarBotoesIdiomaPortal();
  }
  function closeClient(){document.getElementById('clientwrap').classList.remove('show')}

  /* ===== CRIAR — router de painéis (único âmbito desta alteração) ===== */
  let panelStack=['home'];
  let trabalhoMoment=1;
  let trabalhoModo='completo';
  function showPanel(name){
    document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('show', p.dataset.panel===name));
    const panelTitleKeys={
      home:'sheet.create', trabalho:'wizard.newJob', contrato:'wizard.newContract',
      'contrato-usar':'library.saved',
      'comunidade-contratos':'explore.contractLibrary',
      'modelo-lista':'wizard.newTemplate',
      'comunidade-modelos':'explore.library',
      cliente:'wizard.newClient', tarefa:'wizard.newTask',
      importar:'sheet.import', 'importar-texto':'sheet.import', 'importar-referencias':'sheet.import',
      'importar-loading':'sheet.import', 'importar-resultado':'action.confirm',
      'importar-contrato-antigo':'wizard.importContract', 'importar-contrato-loading':'wizard.importContract',
      'importar-contrato-resultado':'wizard.structureDetected',
      'importar-modelo-antigo':'wizard.importTemplate', 'importar-modelo-loading':'wizard.importTemplate',
      'importar-modelo-resultado':'wizard.fieldsDetected',
    };
    const key = panelTitleKeys[name];
    document.getElementById('sheetTitle').textContent = key ? t(key) : t('nav.create');
    document.getElementById('sheetBody').scrollTop=0;
    syncChrome();
  }
  const WIZARD_STEP_KEYS=['wizard.step1','wizard.step2','wizard.step3','wizard.step4','wizard.step5','wizard.step6','wizard.step7','wizard.step8'];
  function syncChrome(){
    const current=panelStack[panelStack.length-1];
    const back=document.getElementById('sheetBack');
    const showBack = panelStack.length>1 || (current==='trabalho' && trabalhoMoment>1);
    back.style.display = showBack? 'grid':'none';
    const prog=document.getElementById('sheetProgress');
    const header=document.getElementById('sheetHeader');
    if(current==='trabalho'){
      // 8 pontos para as 8 etapas; o resumo (momento 8) mantém os 8 pontos
      // preenchidos com o último marcado como atual.
      const passo=Math.min(trabalhoMoment,8);
      prog.style.display='flex';
      prog.querySelectorAll('span').forEach((s,i)=>{
        s.classList.toggle('on', i<passo);
        s.classList.toggle('current', i===passo-1);
      });
      header.classList.add('wiz');
      document.getElementById('sheetTitle').textContent=t(WIZARD_STEP_KEYS[trabalhoMoment-1]||'wizard.step1');
    } else {
      prog.style.display='none';
      header.classList.remove('wiz');
    }
  }
  function pushPanel(name){
    panelStack.push(name);
    showPanel(name);
    if(name==='trabalho'){ trabalhoGoto(1); populateEnderecoSuggestions(); populateCategoriaWizardSelect(); }
    if(name==='tarefa'){
      limparFormularioTarefa(); populateTrabalhoSelects();
    }
    if(name==='receita') limparFormularioReceitaPanel();
    if(name==='despesa') limparFormularioDespesaPanel();
    if(name==='importar-referencias') renderReferenciasGuardadas();
    if(name==='comunidade-contratos') renderBibliotecaPanel('contratos');
    if(name==='comunidade-modelos') renderBibliotecaPanel('modelos');
    if(name==='contrato-usar') renderListaUsarModelo();
  }
  function panelBack(){
    const current=panelStack[panelStack.length-1];
    if(current==='trabalho' && trabalhoMoment>1){
      const target = (trabalhoMoment===4 && trabalhoModo==='rapido') ? 1 : trabalhoMoment-1;
      trabalhoGoto(target); return;
    }
    if(panelStack.length>1){ panelStack.pop(); showPanel(panelStack[panelStack.length-1]); }
  }
  function resetSheet(){ panelStack=['home']; resetTrabalho(); showPanel('home'); }

  function openSheet(){
    _omOpen('sheet', function(){
      resetSheet();
      document.getElementById('overlay').classList.add('show');
      document.getElementById('sheet').classList.add('show');
    });
  }
  function closeSheet(){
    _omClose('sheet', function(){
      document.getElementById('overlay').classList.remove('show');
      document.getElementById('sheet').classList.remove('show');
    });
  }
  function toggleFabMenu(){
    const m=document.getElementById('fab-menu');
    m.classList.toggle('open');
  }
  function closeFabMenu(){
    document.getElementById('fab-menu').classList.remove('open');
  }
  function openSheetDirect(panel){
    openSheet();
    requestAnimationFrame(()=>pushPanel(panel));
  }
