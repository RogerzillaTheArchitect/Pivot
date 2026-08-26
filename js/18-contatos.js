/* Pivots — contatos
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===================== CONTATOS — diretório unificado =====================
     Junta num só lugar clientes e colaboradores, com dados, histórico de
     trabalhos e resumo financeiro. Clientes vêm de clientesData (tipo Cliente)
     e dos nomes de cliente já usados em trabalhos; colaboradores vêm de
     clientesData (tipo != Cliente), dos external_collaborators (por trabalho)
     e dos membros de equipa. */
  let contatosSubAtiva='clientes';
  let colaboradoresExternosTodos=[];
  async function carregarColabsExternosTodos(){
    try{
      if(!sb || !currentWorkspaceId){ colaboradoresExternosTodos=[]; return; }
      const { data, error } = await sb.from('external_collaborators').select('*').eq('workspace_id', currentWorkspaceId).neq('status','removido');
      colaboradoresExternosTodos = error ? [] : (data||[]);
    }catch(e){ colaboradoresExternosTodos=[]; }
  }
  async function abrirContatos(){
    await carregarColabsExternosTodos();
    contatosSubAtiva='clientes';
    document.getElementById('ct-tab-clientes').classList.add('on');
    document.getElementById('ct-tab-colaboradores').classList.remove('on');
    const busca=document.getElementById('ct-busca'); if(busca) busca.value='';
    renderContatos();
  }
  function mudarSubContatos(sub){
    contatosSubAtiva=sub;
    document.getElementById('ct-tab-clientes').classList.toggle('on', sub==='clientes');
    document.getElementById('ct-tab-colaboradores').classList.toggle('on', sub==='colaboradores');
    renderContatos();
  }
  function coletarClientes(){
    const mapa={};
    Object.values(clientesData).forEach(c=>{
      if((c.tipo||'Cliente')==='Cliente')
        mapa[c.nome.toLowerCase()]={ nome:c.nome, email:c.email||'', telefone:c.telefone||'', empresa:c.empresa||'', tipo:'Cliente',
          instagram:c.instagram||'', notas:c.notas||'', foto:c.foto||null };
    });
    jobsVisiveis().forEach(j=>{
      if(!j.client) return;
      const k=j.client.toLowerCase();
      if(!mapa[k]) mapa[k]={ nome:j.client, email:j.email||'', telefone:'', empresa:'', tipo:'Cliente' };
      else if(!mapa[k].email && j.email) mapa[k].email=j.email;
    });
    return Object.values(mapa).sort((a,b)=>a.nome.localeCompare(b.nome));
  }
  function coletarColaboradores(){
    const mapa={};
    const add=(nome,email,extra)=>{
      const k=(email||nome||'').toLowerCase();
      if(!k) return;
      if(!mapa[k]) mapa[k]=Object.assign({ nome:nome||email, email:email||'', telefone:'', empresa:'', tipo:'Colaborador' }, extra||{});
      else if(!mapa[k].email && email) mapa[k].email=email;
    };
    Object.values(clientesData).forEach(c=>{
      if((c.tipo||'Cliente')!=='Cliente') add(c.nome, c.email, { tipo:c.tipo||'Colaborador', telefone:c.telefone||'', empresa:c.empresa||'',
        instagram:c.instagram||'', notas:c.notas||'', foto:c.foto||null });
    });
    (colaboradoresExternosTodos||[]).forEach(c=>add(c.nome||c.email, c.email, { tipo:'Colaborador' }));
    (membrosEquipa||[]).forEach(m=>{ if(currentUser && m.user_id===currentUser.id) return; add(m.nome||m.email, m.email, { tipo:'Equipa' }); });
    return Object.values(mapa).sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
  }
  function trabalhosDoCliente(nome){
    const k=(nome||'').toLowerCase();
    return jobsVisiveis().filter(j=>(j.client||'').toLowerCase()===k);
  }
  function trabalhosDoColaborador(email){
    const k=(email||'').toLowerCase();
    if(!k) return [];
    const ids=new Set((colaboradoresExternosTodos||[]).filter(c=>(c.email||'').toLowerCase()===k).map(c=>c.job_id));
    return jobsVisiveis().filter(j=>ids.has(j.id));
  }
  function renderContatos(){
    const q=(document.getElementById('ct-busca').value||'').trim().toLowerCase();
    const lista = contatosSubAtiva==='clientes' ? coletarClientes() : coletarColaboradores();
    const filtrada = q ? lista.filter(c=>((c.nome||'')+' '+(c.email||'')+' '+(c.empresa||'')).toLowerCase().includes(q)) : lista;
    const wrap=document.getElementById('contatos-lista');
    document.getElementById('contatosEmpty').style.display = filtrada.length? 'none':'block';
    wrap.innerHTML = filtrada.map(c=>{
      const njobs = contatosSubAtiva==='clientes' ? trabalhosDoCliente(c.nome).length : trabalhosDoColaborador(c.email).length;
      const sub = (c.email||t('contacts.noEmail')) + (njobs? (' · '+njobs+' '+(njobs===1?t('contacts.jobCount1'):t('contacts.jobsCount'))) : '');
      const key = contatosSubAtiva==='clientes' ? ('cli:'+c.nome) : ('col:'+(c.email||c.nome));
      /* Nome, tag e info em linhas próprias (divs empilhados, não texto
         concatenado dentro de .nm) — antes a tag entrava no mesmo fluxo de
         texto do nome e quebrava de forma imprevisível (ora colada ao nome,
         ora empurrada pra baixo dele) por não ter layout próprio. */
      const tag = (c.tipo && c.tipo!=='Cliente') ? '<div style="margin:3px 0 1px"><span class="sig-tag" style="background:var(--btn-06);color:var(--ink-soft);font-size:10px">'+escapeHtml(c.tipo)+'</span></div>' : '';
      return '<div class="pick-row u-row-full" onclick="abrirContatoDetalhe(\''+escapeHtml(key).replace(/'/g,"\\'")+'\')">'+
        '<div>'+avatarHtml(c.nome,34,c.foto)+
        '<div class="u-min-0">'+
          '<div class="nm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escapeHtml(c.nome)+'</div>'+
          tag+
          '<div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(sub)+'</div>'+
        '</div></div>'+
        '<svg class="chevr u-flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>';
    }).join('');
  }
  function linhaInfoContato(label,val){
    return '<div class="prow u-cur-default"><div class="u-flex-1"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--neutral)">'+escapeHtml(label)+'</div><div style="font-size:14px;font-weight:500;white-space:pre-wrap">'+escapeHtml(val)+'</div></div></div>';
  }
  function abrirContatoDetalhe(key){
    const sep=key.indexOf(':');
    const tipo=key.slice(0,sep), id=key.slice(sep+1);
    let c, jobs, together=false;
    if(tipo==='cli'){
      c = coletarClientes().find(x=>x.nome===id) || {nome:id,email:'',tipo:'Cliente'};
      jobs = trabalhosDoCliente(id);
    } else {
      c = coletarColaboradores().find(x=>(x.email||x.nome)===id) || {nome:id,email:id,tipo:'Colaborador'};
      jobs = trabalhosDoColaborador(c.email);
      together=true;
    }
    let faturado=0, recebido=0;
    jobs.forEach(j=>{
      const ps=j.payments||[];
      if(ps.length){ ps.forEach(p=>{ const v=Number(p.amount)||0; faturado+=v; if(p.status==='pago') recebido+=v; }); }
      else if(j.value){ faturado+=Number(j.value)||0; }
    });
    const porReceber=Math.max(0, faturado-recebido);
    let html='<div style="display:flex;align-items:center;gap:13px;margin-bottom:18px">'+avatarHtml(c.nome,52,c.foto)+
      '<div style="min-width:0;flex:1"><div style="font-size:21px;font-weight:700">'+escapeHtml(c.nome)+'</div>'+
      '<div class="u-sm-soft">'+escapeHtml(c.tipo||'Cliente')+(c.email?(' · '+escapeHtml(c.email)):'')+'</div></div>'+
      '<button class="btn dark u-flex-none" onclick="abrirEditarContato(\''+escapeHtml(key).replace(/'/g,"\\'")+'\')">'+t('action.edit')+'</button></div>';
    html+='<div class="plist u-mb-16">';
    if(c.email) html+=linhaInfoContato('Email', c.email);
    if(c.telefone) html+=linhaInfoContato(t('profile.company.phone'), c.telefone);
    if(c.empresa) html+=linhaInfoContato(t('field.company'), c.empresa);
    if(c.instagram) html+=linhaInfoContato('Instagram', c.instagram);
    if(c.notas) html+=linhaInfoContato(t('wizard.client.notes'), c.notas);
    if(!c.email && !c.telefone && !c.empresa && !c.instagram && !c.notas) html+='<div class="prow u-cur-default"><div class="sub u-c-neutral">'+t('contacts.noEmail')+'</div></div>';
    html+='</div>';
    if(tipo==='cli'){
      html+='<div class="ct-stats">'+
        '<div class="ct-stat"><div class="v">'+fmtMoney(faturado)+'</div><div class="l">'+t('contacts.totalBilled')+'</div></div>'+
        '<div class="ct-stat"><div class="v">'+fmtMoney(recebido)+'</div><div class="l">'+t('contacts.received')+'</div></div>'+
        '<div class="ct-stat"><div class="v">'+fmtMoney(porReceber)+'</div><div class="l">'+t('contacts.pending')+'</div></div></div>';
    }
    html+='<div class="plabel" style="margin:18px 2px 10px">'+(together?t('contacts.together'):t('contacts.history'))+' ('+jobs.length+')</div>';
    if(jobs.length){
      html+=jobs.map(j=>{
        const ccl=classificarTrabalho(j);
        const estado=ccl.concluido?t('jobs.filter.done'):(ccl.fechado?t('jobs.status.active'):t('jobs.status.waiting'));
        return '<div class="pick-row" onclick="openJob(\''+j.id+'\')"><div class="u-flex-min"><div class="nm">'+escapeHtml(j.typeLabel||j.nome||'Trabalho')+'</div><div class="sub">'+escapeHtml(j.date||'')+' · '+estado+'</div></div><svg class="chevr u-flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>';
      }).join('');
    } else {
      html+='<p class="u-label-nd">'+t('contacts.noHistory')+'</p>';
    }
    document.getElementById('contato-detalhe-corpo').innerHTML=html;
    go('contato-detalhe');
  }

  /* 📅 Evento */
  let recursosAdicionaisAtuais=[];
  function renderRecursosLista(){
    const wrap=document.getElementById('tw-recursos-lista');
    if(!wrap) return;
    wrap.innerHTML = recursosAdicionaisAtuais.map((r,i)=>
      '<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(r.nome)+'</div><span class="sub">'+escapeHtml(r.tipo)+(r.custo?(' · '+fmtMoney(r.custo)):'')+'</span></div>'+
      '<div style="display:flex;gap:14px;align-items:center;flex:none">'+
      '<svg class="u-ico-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="abrirModalRecurso('+i+')"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>'+
      '<svg class="u-ico-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="removerRecursoAdicional('+i+')"><path d="M18 6 6 18M6 6l12 12"/></svg>'+
      '</div></div>'
    ).join('');
  }
  function abrirModalRecurso(editIndex){
    const editando = editIndex!=null && editIndex!=='null';
    const r = editando ? recursosAdicionaisAtuais[editIndex] : {nome:'',tipo:'Profissional',custo:''};
    openInfo(editando?'Editar recurso':'Adicionar recurso', `
      <div class="field"><label>Nome</label><input id="rec-modal-nome" value="${escapeHtml(r.nome)}" placeholder="${t('upload.resourcePlaceholder')}"></div>
      <div class="field"><label>Tipo</label><select id="rec-modal-tipo">
        <option${r.tipo==='Profissional'?' selected':''}>Profissional</option>
        <option${r.tipo==='Equipamento'?' selected':''}>Equipamento</option>
        <option${r.tipo===t('builder.service')?' selected':''}>Serviço</option>
      </select></div>
      <div class="field"><label>Custo <span class="u-c-neutral u-fw-normal">(opcional)</span></label><input id="rec-modal-custo" type="number" min="0" value="${r.custo||''}" placeholder="250"></div>
      <button class="btn primary u-w-full" onclick="guardarRecursoModal(${editando?editIndex:'null'})">Guardar</button>
    `);
  }
  function guardarRecursoModal(editIndex){
    const nomeEl=document.getElementById('rec-modal-nome');
    const nome=nomeEl.value.trim();
    if(!nome){ nomeEl.focus(); showToast(t('toast.writeResourceName')); return; }
    const tipo=document.getElementById('rec-modal-tipo').value;
    const custo=parseFloat(document.getElementById('rec-modal-custo').value)||0;
    if(editIndex!=null && editIndex!=='null') recursosAdicionaisAtuais[editIndex]={nome,tipo,custo};
    else recursosAdicionaisAtuais.push({nome,tipo,custo});
    renderRecursosLista();
    closeInfo();
  }
  function removerRecursoAdicional(i){
    recursosAdicionaisAtuais.splice(i,1);
    renderRecursosLista();
  }
  /* ✅ Tarefa */
  function addPessoaRow(){
    const rows=document.getElementById('ta-pessoas-rows');if(!rows) return;
    const row=document.createElement('div'); row.className='ta-pessoa-row';
    row.innerHTML='<input class="ta-pessoa-email" type="email" placeholder="email do membro"><span class="rm" onclick="this.parentElement.remove()">✕</span>';
    rows.appendChild(row); row.querySelector('input').focus();
  }
  function addTarefaItem(){
    const row=document.createElement('div'); row.className='addlist-row';
    row.innerHTML='<span class="dots">⠿</span><input class="ta-item-input" placeholder="Item…" onkeydown="if(event.key===\'Enter\'){addTarefaItem();event.preventDefault();}"><span class="rm" onclick="this.parentElement.remove()">✕</span>';
    document.getElementById('ta-items').appendChild(row);
    row.querySelector('input').focus();
  }
  function selecionarPrioridade(el){
    el.parentElement.querySelectorAll('.priority-opt').forEach(o=>o.classList.remove('on'));
    el.classList.add('on');
  }
  /* Painel unificado (Tarefa) despacha pro modo ativo: Simples grava em
     tarefasData (criarTarefa), Checklist grava em listasData (criarLista,
     reaproveitada tal e qual do antigo painel "Lista"). */
  var _taConflitoConfirmado=false;
  function _detectarConflitoTarefa(data,hora,duracaoMin){
    if(!data||!hora) return null;
    var tMin=function(h){ var p=h.split(':'); return +p[0]*60+(+p[1]||0); };
    var s=tMin(hora), e=duracaoMin>0?s+duracaoMin:s+1;
    return gerarItensRadar().find(function(it){
      if(it.dataISO!==data||!it.hora) return false;
      var is=tMin(it.hora), ie=it.horaFim?tMin(it.horaFim):is+30;
      return s<ie&&e>is;
    })||null;
  }
  window.agdVerificarConflitoTarefa=function(){
    var data=document.getElementById('ta-data').value||null;
    var hora=document.getElementById('ta-hora').value||null;
    var dur=parseInt(document.getElementById('ta-duracao').value||'0',10)||0;
    var aviso=document.getElementById('ta-aviso-conflito');
    var btn=document.querySelector('[onclick="criarTarefa()"]');
    _taConflitoConfirmado=false;
    if(btn) btn.dataset.step='';
    if(!aviso) return;
    var c=_detectarConflitoTarefa(data,hora,dur);
    if(c){ aviso.textContent='⚠️ Conflito: "'+c.nome+'" já ocupa parte desse horário.'; aviso.style.display=''; }
    else{ aviso.textContent=''; aviso.style.display='none'; }
  };
  function criarTarefa(){
    const titulo=document.getElementById('ta-titulo').value.trim();
    if(!titulo){ showToast(t('toast.writeTaskDescription')); return; }
    const novaData=document.getElementById('ta-data').value||null;
    const novaHora=document.getElementById('ta-hora').value||null;
    const duracaoMin=parseInt(document.getElementById('ta-duracao').value||'0',10)||0;
    if(novaData&&novaHora&&!_taConflitoConfirmado){
      const conflito=_detectarConflitoTarefa(novaData,novaHora,duracaoMin);
      if(conflito){
        _taConflitoConfirmado=true;
        const btn=document.querySelector('[onclick="criarTarefa()"]');
        if(btn){ btn.style.background='var(--late)'; btn.firstElementChild.textContent='Criar assim mesmo →'; }
        showToast('⚠️ "'+conflito.nome+'" ocupa esse horário — clique novamente para confirmar');
        return;
      }
    }
    _taConflitoConfirmado=false;
    const btn=document.querySelector('[onclick="criarTarefa()"]');
    if(btn){ btn.style.background=''; btn.firstElementChild.setAttribute('data-t','wizard.createTask'); btn.firstElementChild.textContent=t('wizard.createTask'); }
    const id='tar'+Date.now();
    const jobId=document.getElementById('ta-trabalho').value||null;
    const prioEl=document.querySelector('#ta-prioridade-picker .priority-opt.on');
    const pessoas=[...document.querySelectorAll('#ta-pessoas-rows .ta-pessoa-email')].map(el=>el.value.trim().toLowerCase()).filter(Boolean);
    const itens=[...document.querySelectorAll('#ta-items .ta-item-input')]
      .map(el=>el.value.trim()).filter(Boolean).map(tx=>({t:tx,feito:false}));
    const horaVal=document.getElementById('ta-hora').value||null;
    let horaFimVal=null;
    if(horaVal&&duracaoMin>0){
      const [hh,mm]=horaVal.split(':').map(Number);
      const totM=hh*60+mm+duracaoMin;
      horaFimVal=String(Math.floor(totM/60)%24).padStart(2,'0')+':'+String(totM%60).padStart(2,'0');
    }
    tarefasData[id]={ id, tipo:'simples', titulo,
      data:document.getElementById('ta-data').value||null,
      hora:horaVal,
      horaFim:horaFimVal,
      prioridade: prioEl ? prioEl.dataset.val : t('task.priorityNormal'),
      jobId, notas:document.getElementById('ta-notas').value.trim(), feito:false,
      pessoas:pessoas.length?pessoas:undefined,
      itens:itens.length?itens:undefined };
    if(jobId && jobsData[jobId]){ pushHistory(jobsData[jobId], 'Tarefa criada: '+titulo); saveJobsData(); }
    criarNotificacoesPessoas(pessoas,'tarefa',id,titulo);
    showToast(t('toast.taskPrefix')+titulo+t('toast.createdFemSuffix'));
    saveTarefasData();
    renderMonthTicker();
    if(typeof renderTasksList==='function') renderTasksList();
    if(jobId && currentJobId===jobId && document.getElementById('detalhe-dynamic').style.display!=='none'){
      renderJobDetailDynamic(jobId);
    }
    closeSheet();
    limparFormularioTarefa();
  }
  function limparFormularioTarefa(){
    _taConflitoConfirmado=false;
    const avisoEl=document.getElementById('ta-aviso-conflito'); if(avisoEl){ avisoEl.style.display='none'; avisoEl.textContent=''; }
    const btnCriar=document.querySelector('[onclick="criarTarefa()"]'); if(btnCriar){ btnCriar.style.background=''; const sp=btnCriar.firstElementChild; if(sp){ sp.setAttribute('data-t','wizard.createTask'); sp.textContent=t('wizard.createTask')||'Criar tarefa →'; } }
    ['ta-titulo','ta-data','ta-hora','ta-duracao','ta-notas'].forEach(i=>{ const el=document.getElementById(i); if(el) el.value=''; });
    const sel=document.getElementById('ta-trabalho'); if(sel) sel.value='';
    const prioPicker=document.getElementById('ta-prioridade-picker');
    if(prioPicker){ prioPicker.querySelectorAll('.priority-opt').forEach((o,i)=>o.classList.toggle('on', i===0)); }
    const taItems=document.getElementById('ta-items'); if(taItems) taItems.innerHTML='';
    const pessoasRows=document.getElementById('ta-pessoas-rows');
    if(pessoasRows) pessoasRows.innerHTML='<div class="ta-pessoa-row"><input class="ta-pessoa-email" type="email" placeholder="email do membro"><button class="btn soft ta-plus-btn" onclick="addPessoaRow()">+</button></div>';
  }

  /* 🔔 Lembrete — a criação foi unificada em Tarefa > Simples (o antigo
     painel "Lembrete" some, mas a store/leitura continua aqui tal e qual,
     pra lembretes já criados antes continuarem a aparecer/editar/excluir
     normalmente no radar de Tarefas e na página do trabalho). */
  let lembretesData={};
  function saveLembretesData(){ savePersisted('pivot-lembretesData', ()=>lembretesData); }
  async function loadLembretesData(){ await loadPersisted('pivot-lembretesData', d=>{ lembretesData=d||{}; }); }
  function toggleLembreteItem(id, el){
    const l=lembretesData[id];
    if(!l) return;
    l.feito=!l.feito;
    el.classList.toggle('on');
    saveLembretesData();
    if(l.jobId) renderJobDetailDynamic(l.jobId);
  }
  function marcarLembreteFeito(id){
    const l=lembretesData[id];
    if(!l) return;
    l.feito=true;
    saveLembretesData();
    closeInfo();
    if(typeof renderTasksList==='function') renderTasksList();
    if(l.jobId) renderJobDetailDynamic(l.jobId);
    showToast(t('toast.done'));
  }
  function excluirLembrete(id){
    const l=lembretesData[id];
    const jobId=l&&l.jobId;
    delete lembretesData[id];
    saveLembretesData();
    closeInfo();
    if(typeof renderTasksList==='function') renderTasksList();
    if(jobId) renderJobDetailDynamic(jobId);
    showToast(t('toast.removed'));
  }

  /* ☑️ Lista — checklist avulsa, mesmo mecanismo de itens do modo Checklist
     de Tarefa (addlist-row/#ls-items). Solta, só entra no radar de Tarefas
     se tiver data E prioridade definidas (sem isso não há como ordená-la
     entre os outros itens); vinculada a um trabalho aparece sempre na
     secção "Listas" da página do trabalho, sem precisar de data/prioridade. */
  let listasData={};
  function saveListasData(){ savePersisted('pivot-listasData', ()=>listasData); }
  async function loadListasData(){ await loadPersisted('pivot-listasData', d=>{ listasData=d||{}; }); }
  function criarLista(){
    { const limite=LIMITE_LISTAS_PLANO[perfilData.plano||'Free'];
      if(Object.keys(listasData).length>=limite){ abrirLimitePlanoModal('plan.limit.listsTitle','plan.limit.listsBody',limite); return; } }
    const titulo=document.getElementById('ls-titulo').value.trim()||t('list.untitled');
    const itens=[...document.querySelectorAll('#ls-items .tx')].map(el=>({t:el.textContent, feito:false}));
    if(!itens.length){ showToast(t('toast.addAtLeastOneItem')); return; }
    const id='lst'+Date.now();
    const jobId=document.getElementById('ls-trabalho').value||null;
    const prioEl=document.querySelector('#ls-prioridade-picker .priority-opt.on');
    const pessoasLs=getPessoasSelecionadas('ls-pessoas-picker');
    listasData[id]={ id, titulo, itens, jobId,
      data:document.getElementById('ls-data').value||null,
      hora:document.getElementById('ls-hora').value||null,
      prioridade: prioEl ? prioEl.dataset.val : null,
      notas:document.getElementById('ls-notas').value.trim(),
      feito:false, criadoEm:new Date().toISOString(),
      pessoas:pessoasLs.length?pessoasLs:undefined };
    saveListasData();
    criarNotificacoesPessoas(pessoasLs,'lista',id,titulo);
    if(jobId && jobsData[jobId]){ pushHistory(jobsData[jobId], t('list.historyCreated')+titulo); saveJobsData(); }
    showToast(t('toast.listPrefix')+titulo+t('toast.createdFemSuffix'));
    renderMonthTicker();
    if(typeof renderTasksList==='function') renderTasksList();
    if(jobId && currentJobId===jobId && document.getElementById('detalhe-dynamic').style.display!=='none'){
      renderJobDetailDynamic(jobId);
    }
    closeSheet();
    limparFormularioLista();
  }
  function limparFormularioLista(){
    ['ls-titulo','ls-data','ls-hora','ls-notas'].forEach(i=>{ const el=document.getElementById(i); if(el) el.value=''; });
    const items=document.getElementById('ls-items'); if(items) items.innerHTML='';
    const sel=document.getElementById('ls-trabalho'); if(sel) sel.value='';
    const prioPicker=document.getElementById('ls-prioridade-picker');
    if(prioPicker){ prioPicker.querySelectorAll('.priority-opt').forEach((o,i)=>o.classList.toggle('on', i===0)); }
  }
  function toggleListaItem(id, i, el){
    const ls=listasData[id];
    if(!ls) return;
    ls.itens[i].feito=!ls.itens[i].feito;
    el.classList.toggle('on');
    saveListasData();
    abrirDetalheItemSolto('lista', id);
    if(ls.jobId) renderJobDetailDynamic(ls.jobId);
  }
  function toggleTarefaSubItem(id, i, el){
    const tk=tarefasData[id];
    if(!tk||!tk.itens) return;
    tk.itens[i].feito=!tk.itens[i].feito;
    el.classList.toggle('on');
    saveTarefasData();
    abrirDetalheItemSolto('tarefa', id);
    if(tk.jobId) renderJobDetailDynamic(tk.jobId);
    if(typeof renderTasksList==='function') renderTasksList();
  }
  function excluirLista(id){
    const ls=listasData[id];
    const jobId=ls&&ls.jobId;
    delete listasData[id];
    saveListasData();
    closeInfo();
    if(typeof renderTasksList==='function') renderTasksList();
    if(jobId) renderJobDetailDynamic(jobId);
    showToast(t('toast.removed'));
  }
  /* Detalhe rápido de um lembrete/lista solto — aberto a partir do card do
     radar de Tarefas (Dashboard) quando não há trabalho pra abrir. */
  function abrirDetalheItemSolto(tipo, id){
    if(tipo==='lembrete'){
      const l=lembretesData[id]; if(!l) return;
      openInfo(l.titulo,
        '<p class="u-label-soft u-mb-10">'+t('field.date')+': '+l.data.split('-').reverse().join('/')+(l.hora?(' · '+l.hora):'')+'</p>'+
        (l.notas?('<p class="u-hint u-pre-wrap">'+escapeHtml(l.notas)+'</p>'):'')+
        (l.feito?'':'<button class="btn primary u-w-full u-mb-8" onclick="marcarLembreteFeito(\''+id+'\')">'+t('action.complete')+'</button>')+
        '<button class="btn ghost u-w-full" onclick="excluirLembrete(\''+id+'\')">'+t('action.remove')+'</button>');
    } else if(tipo==='lista'){
      const ls=listasData[id]; if(!ls) return;
      const itensHtml=(ls.itens||[]).map((it,i)=>'<div class="struct-row"><div class="struct-l"><div class="nm" style="'+(it.feito?'text-decoration:line-through;color:var(--neutral)':'')+'">'+escapeHtml(it.t)+'</div></div><div class="toggle'+(it.feito?' on':'')+'" onclick="toggleListaItem(\''+id+'\','+i+',this)"><div class="kn"></div></div></div>').join('');
      openInfo(ls.titulo, itensHtml+
        (ls.notas?('<p style="font-size:13.5px;color:var(--ink-soft);white-space:pre-wrap;margin-top:14px">'+escapeHtml(ls.notas)+'</p>'):'')+
        '<button class="btn ghost u-w-full u-mt-14" onclick="excluirLista(\''+id+'\')">'+t('action.remove')+'</button>');
    } else if(tipo==='tarefa'){
      const tk=tarefasData[id]; if(!tk) return;
      const tkItensHtml=(tk.itens&&tk.itens.length)
        ? (tk.itens.map((it,i)=>'<div class="struct-row"><div class="struct-l"><div class="nm" style="'+(it.feito?'text-decoration:line-through;color:var(--neutral)':'')+'">'+escapeHtml(it.t)+'</div></div><div class="toggle'+(it.feito?' on':'')+'" onclick="toggleTarefaSubItem(\''+id+'\','+i+',this)"><div class="kn"></div></div></div>').join(''))
        : '';
      const hasItens=tk.itens&&tk.itens.length;
      openInfo(tk.titulo,
        (tk.data?('<p class="u-label-soft u-mb-10">'+t('field.date')+': '+tk.data.split('-').reverse().join('/')+(tk.hora?(' \u00B7 '+tk.hora):'')+'</p>'):'')+
        tkItensHtml+
        (tk.notas?('<p class="u-hint u-pre-wrap">'+escapeHtml(tk.notas)+'</p>'):'')+
        (!hasItens&&!tk.feito?'<button class="btn primary u-w-full u-mb-8" onclick="marcarTarefaFeita(\''+id+'\')">'+t('action.complete')+'</button>':'')+
        '<button class="btn ghost u-w-full" onclick="excluirTarefa(\''+id+'\')">'+t('action.remove')+'</button>');
    }
  }
  function marcarTarefaFeita(id){
    const tk=tarefasData[id];
    if(!tk) return;
    tk.feito=true;
    saveTarefasData();
    closeInfo();
    if(typeof renderTasksList==='function') renderTasksList();
    if(tk.jobId) renderJobDetailDynamic(tk.jobId);
    showToast(t('toast.done'));
  }
  function excluirTarefa(id){
    const tk=tarefasData[id];
    const jobId=tk&&tk.jobId;
    delete tarefasData[id];
    saveTarefasData();
    closeInfo();
    if(typeof renderTasksList==='function') renderTasksList();
    if(jobId) renderJobDetailDynamic(jobId);
    showToast(t('toast.removed'));
  }

  /* 📥 Importar — conversa / print / pdf */
  /* 📥 Importar — guardar contrato antigo como referência, sem extração automática */
  let referenciasData={};
  function saveReferenciasData(){ savePersisted('pivot-referenciasData', ()=>referenciasData); }
  async function loadReferenciasData(){ await loadPersisted('pivot-referenciasData', d=>{ referenciasData=d; }); }
  let importRefFile=null;
  function onImportRefFileSelected(input){
    const file=input.files[0]; if(!file) return;
    importRefFile=file;
    document.getElementById('imp-ref-dropzone').style.display='none';
    document.getElementById('imp-ref-filename').textContent=file.name;
    document.getElementById('imp-ref-filechip').style.display='flex';
  }
  function resetImportRefFile(){
    importRefFile=null;
    document.getElementById('imp-ref-file-input').value='';
    document.getElementById('imp-ref-filechip').style.display='none';
    document.getElementById('imp-ref-dropzone').style.display='block';
  }
  function fileParaDataUrl(file){
    return new Promise((res,rej)=>{
      const r=new FileReader();
      r.onload=()=>res(r.result);
      r.onerror=rej;
      r.readAsDataURL(file);
    });
  }
  /* Comprime imagens antes de guardar (avatar, anexos, referências) — reduz
     fotos de câmara/telemóvel (muitas vezes vários MB) para um tamanho razoável
     sem depender de bibliotecas novas. Ficheiros não-imagem (PDF, docs) passam
     tal como estão — comprimir binários arbitrários no browser não é viável
     sem uma dependência nova, que foi pedido para evitar. */
  function imagemComprimidaDataUrl(file, maxDim, qualidade){
    maxDim = maxDim||1280; qualidade = qualidade||0.82;
    return new Promise((resolve,reject)=>{
      const img=new Image();
      const urlObjeto=URL.createObjectURL(file);
      img.onload=()=>{
        URL.revokeObjectURL(urlObjeto);
        let {width, height}=img;
        if(width>maxDim || height>maxDim){
          const escala=maxDim/Math.max(width,height);
          width=Math.round(width*escala); height=Math.round(height*escala);
        }
        const canvas=document.createElement('canvas');
        canvas.width=width; canvas.height=height;
        canvas.getContext('2d').drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.onerror=reject;
      img.src=urlObjeto;
    });
  }
  async function arquivoParaDataUrlComprimido(file){
    if(file.type && file.type.startsWith('image/')){
      try{ return await imagemComprimidaDataUrl(file); }catch(e){ /* fallback abaixo */ }
    }
    return fileParaDataUrl(file);
  }
  async function guardarReferenciaImportada(){
    const nomeEl=document.getElementById('imp-ref-nome');
    const nome=nomeEl.value.trim();
    const texto=document.getElementById('imp-ref-texto').value.trim();
    if(!nome){ nomeEl.focus(); showToast(t('toast.nameRequiredRef')); return; }
    if(!importRefFile && !texto){ showToast(t('toast.uploadOrPasteText')); return; }
    const id='ref'+Date.now();
    let ficheiroNome=null, ficheiroDataUrl=null;
    if(importRefFile){
      ficheiroNome=importRefFile.name;
      try{ ficheiroDataUrl=await arquivoParaDataUrlComprimido(importRefFile); }catch(e){ /* guarda só o nome se a leitura falhar */ }
    }
    referenciasData[id]={id, nome, texto: texto||null, ficheiroNome, ficheiroDataUrl, criadoEm:new Date().toISOString()};
    saveReferenciasData();
    closeSheet();
    showToast(t('toast.referenceSaved'));
    nomeEl.value='';
    document.getElementById('imp-ref-texto').value='';
    resetImportRefFile();
  }
  function renderReferenciasGuardadas(){
    const wrap=document.getElementById('imp-ref-lista');
    if(!wrap) return;
    const lista=Object.values(referenciasData).sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm));
    if(!lista.length){ wrap.innerHTML='<p style="font-size:13px;color:var(--neutral);padding:6px 2px">Ainda sem referências guardadas.</p>'; return; }
    wrap.innerHTML=lista.map(r=>
      '<div class="struct-row"><div class="struct-l u-cur-pointer" onclick="verReferenciaGuardada(\''+r.id+'\')"><div class="nm">'+escapeHtml(r.nome)+'</div><span class="sub">'+(r.ficheiroNome?escapeHtml(r.ficheiroNome):'texto colado')+'</span></div>'+
      '<svg class="u-ico-action u-flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="removerReferencia(\''+r.id+'\')"><path d="M18 6 6 18M6 6l12 12"/></svg></div>'
    ).join('');
  }
  function verReferenciaGuardada(id){
    const r=referenciasData[id];
    if(!r) return;
    let body='';
    if(r.texto) body+='<p style="font-size:13px;color:var(--ink-soft);white-space:pre-wrap;line-height:1.6">'+escapeHtml(r.texto)+'</p>';
    if(r.ficheiroDataUrl && r.ficheiroDataUrl.startsWith('data:image/')) body+='<img src="'+r.ficheiroDataUrl+'" style="width:100%;border-radius:var(--r);margin-top:'+(r.texto?'12px':'0')+'">';
    else if(r.ficheiroNome) body+='<p style="font-size:13px;color:var(--neutral);margin-top:'+(r.texto?'12px':'0')+'">Arquivo: '+escapeHtml(r.ficheiroNome)+'</p>';
    if(!body) body='<p class="u-label-nd">Sem conteúdo guardado.</p>';
    openInfo(r.nome, body);
  }
  function removerReferencia(id){
    delete referenciasData[id];
    saveReferenciasData();
    renderReferenciasGuardadas();
  }

  let toastT;
  /* feedback háptico — só funciona em Android/Chrome (a Vibration API nunca foi
     implementada no Safari/iOS, não há alternativa puramente web para isso);
     em iOS esta função não faz nada, silenciosamente, sem quebrar a interação */
  function haptic(style){
    if(!('vibrate' in navigator)) return;
    try{
      if(style==='tick'||style==='light') navigator.vibrate(8);
      else if(style==='snap'||style==='medium') navigator.vibrate(18);
      else if(style==='success') navigator.vibrate([12,40,12]);
      else navigator.vibrate(10);
    }catch(e){}
  }
  function showToast(m){
    haptic('success');
    const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show');
    clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),1900);
  }
  function clientToast(m){
    const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show');
    t.style.bottom='40px'; clearTimeout(toastT);
    toastT=setTimeout(()=>{t.classList.remove('show');t.style.bottom='96px'},1900);
  }
