/* Pivots — overlay i18n
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== Notificações reais — feed a partir dos dados reais ===== */
  function gerarNotificacoes(){
    const hojeISO=new Date().toISOString().slice(0,10);
    let items=[];
    jobsVisiveis().forEach(j=>{
      (j.payments||[]).forEach((p,i)=>{
        if(p.status==='pago') return;
        const atrasado = p.dueDate && p.dueDate < hojeISO;
        items.push({
          id: 'pay:'+j.id+':'+i,
          prioridade: atrasado ? 'urgente' : (p.status==='a_confirmar' ? 'media' : 'media'),
          texto: p.label+' — '+j.client,
          sub: atrasado ? t('payment.overdue') : (p.status==='a_confirmar' ? t('payment.receiptReceivedConfirm') : t('payment.statusPending').toLowerCase()),
          jobId: j.id
        });
      });
      (j.milestones||[]).forEach(m=>{
        if(m.key==='entrega' && m.status!=='feito'){
          items.push({ id:'ms:'+j.id+':'+m.key, prioridade:'normal', texto:t('milestone.delivery')+j.client, sub:m.m, jobId:j.id });
        }
      });
    });
    Object.values(tarefasData).forEach(t=>{
      if(t.feito || t.tipo!=='simples') return;
      items.push({ id:'task:'+t.id, prioridade:prioClasse(t.prioridade), texto:t.titulo, sub:'tarefa'+(t.data?(' · '+t.data.split('-').reverse().slice(0,2).join('/')):''), jobId:t.jobId });
    });
    const ordem={urgente:0, media:1, normal:2};
    return items.filter(it=>!notifDismissed.has(it.id)).sort((a,b)=>ordem[a.prioridade]-ordem[b.prioridade]);
  }
  function gerarAtividadeCliente(){
    let items=[];
    jobsVisiveis().forEach(j=>{
      (j.history||[]).forEach(h=>{
        if(h.tipo==='cliente') items.push({id:'act:'+j.id+':'+(h.tsRaw||0), texto:h.text+' — '+j.client, ts:h.ts, tsRaw:h.tsRaw||0, jobId:j.id});
      });
    });
    items.sort((a,b)=>b.tsRaw-a.tsRaw);
    const seteDiasAtras=Date.now()-7*86400000;
    return items.filter(it=>it.tsRaw>=seteDiasAtras && !notifDismissed.has(it.id));
  }
  let notifDismissed=new Set();
  let notifSeenIds=new Set();
  function saveNotifDismissed(){ savePersisted('pivot-notifDismissed', ()=>[...notifDismissed]); }
  async function loadNotifDismissed(){ await loadPersisted('pivot-notifDismissed', d=>{ notifDismissed=new Set(d||[]); }); }
  /* O botão de excluir fica ANTES do card no DOM, posicionado atrás dele
     (z-index abaixo, opacity:0 + pointer-events:none por padrão) — só
     ativarSwipeNotificacoes() o revela, arrastando o card por cima. Mesma
     estrutura/técnica já usada e comprovada em .radar-card-wrap (ver
     construirCardRadar/ativarSwipeRadar), adaptada pra um único botão à
     direita em vez de dois lados. */
  function notifCardHtml(id, texto, sub, onclick){
    return '<div class="notif-wrap" data-notif="'+id+'">'+
        '<div class="notif-swipe-actions">'+
          '<button type="button" class="notif-swipe-btn" onclick="event.stopPropagation();descartarNotificacao(\''+id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>'+
        '</div>'+
        '<div class="notif-card" onclick="'+onclick+'">'+
          '<div><div class="nm">'+escapeHtml(texto)+'</div><div class="sub">'+escapeHtml(sub)+'</div></div>'+
        '</div>'+
      '</div>';
  }
  /* ===== GLOBAL OVERLAY MANAGER — um transient por vez ===== */
  let __activeOverlay = null; // 'sheet' | 'info' | 'drawer' | null
  function _omForceClose(id){
    __activeOverlay = null;
    if(id==='sheet'){ document.getElementById('overlay').classList.remove('show'); document.getElementById('sheet').classList.remove('show'); }
    else if(id==='info'){ document.getElementById('infoOverlay').classList.remove('show'); document.getElementById('infoSheet').classList.remove('show'); window.__infoBackHandler=null; document.getElementById('infoBackBtn').style.display='none'; }
    else if(id==='drawer'){ document.getElementById('menu-overlay').classList.add('u-hidden'); document.getElementById('menu-drawer').classList.remove('open'); }
  }
  function _omOpen(id, uiFn){
    if(__activeOverlay && __activeOverlay!==id) _omForceClose(__activeOverlay);
    __activeOverlay = id;
    uiFn();
  }
  function _omClose(id, uiFn){
    if(__activeOverlay===id) __activeOverlay=null;
    uiFn();
  }
  /* Click outside — capture phase, fecha o overlay ativo ao clicar fora dele */

  function abrirMenuDrawer(){
    _omOpen('drawer', function(){
      document.getElementById('menu-overlay').classList.remove('u-hidden');
      document.getElementById('menu-drawer').classList.add('open');
      /* Rede de segurança: aplicarPerfilData() só corre no arranque/edição
         de perfil — se a foto for carregada e a sessão nunca mais tocar em
         Conta, o cabeçalho ficava preso no fallback sem foto. Reaplicar aqui
         garante que a layer sobre a foto está sempre atualizada ao abrir. */
      if(typeof aplicarPerfilData==='function') aplicarPerfilData();
    });
  }
  function fecharMenuDrawer(){
    _omClose('drawer', function(){
      document.getElementById('menu-overlay').classList.add('u-hidden');
      document.getElementById('menu-drawer').classList.remove('open');
    });
  }
    function abrirNotificacoes(){
    const items=gerarNotificacoes();
    const atividade=gerarAtividadeCliente();
    items.forEach(it=>notifSeenIds.add(it.id));
    atividade.forEach(a=>notifSeenIds.add(a.id));
    let html='';
    if(!items.length && !atividade.length){
      html='<p style="font-size:13.5px;color:var(--neutral);text-align:center;padding:24px 0">'+t('notif.emptyState')+'</p>';
    } else {
      html+='<button class="btn soft notif-clear-btn" onclick="limparNotificacoes()">'+t('notif.clearAll')+'</button>';
      if(items.length){
        html+=items.map(it=>notifCardHtml(it.id,
          it.texto, it.sub,
          'closeInfo();'+(it.jobId?('openJob(\''+it.jobId+'\')'):'')
        )).join('');
      }
      if(atividade.length){
        html+='<p class="plabel" style="margin:'+(items.length?'14px':'0')+' 2px 6px">'+t('job.clientActivity')+'</p>';
        html+=atividade.map(a=>notifCardHtml(a.id,
          a.texto, a.ts,
          'closeInfo();openJob(\''+a.jobId+'\')'
        )).join('');
      }
    }
    openInfo(t('notif.title'), html);
    ativarSwipeNotificacoes();
    atualizarNotifDot();
  }
  function descartarNotificacao(id){
    notifDismissed.add(id);
    saveNotifDismissed();
    const wrap=document.querySelector('.notif-wrap[data-notif="'+id+'"]');
    if(wrap){ wrap.style.transition='opacity .2s,max-height .2s'; wrap.style.maxHeight=wrap.offsetHeight+'px'; requestAnimationFrame(()=>{ wrap.style.opacity='0'; wrap.style.maxHeight='0'; }); setTimeout(()=>wrap.remove(),220); }
    atualizarNotifDot();
  }
  function limparNotificacoes(){
    gerarNotificacoes().forEach(it=>notifDismissed.add(it.id));
    gerarAtividadeCliente().forEach(a=>notifDismissed.add(a.id));
    saveNotifDismissed();
    abrirNotificacoes();
  }
  /* Swipe-to-reveal estilo iOS — mesmo motor de estados de ativarSwipeRadar
     (closed/aberto, nunca um meio-termo permanente), só que com um único
     lado (direita) e largura própria (LARG=72, a largura real do botão).
     O botão só ganha opacity/pointer-events ao ser revelado pelo arrasto —
     antes disso fica genuinamente invisível e não clicável, nunca "atrás"
     nem "abaixo" do card visível. */
  function ativarSwipeNotificacoes(){
    const LARG=72;
    document.querySelectorAll('#infoBody .notif-wrap').forEach(wrap=>{
      const card=wrap.querySelector('.notif-card');
      const acoes=wrap.querySelector('.notif-swipe-actions');
      if(!card || !acoes) return;
      let aberto=false, moved=false;
      let startX=0, startY=0, baseX=0, curX=0, dragging=false, pointerId=null, horizontal=null;
      const setActions=x=>{
        const p=Math.min(1, -x/LARG);
        acoes.style.opacity=p; acoes.style.pointerEvents=p>0?'auto':'none';
      };
      card.addEventListener('pointerdown', e=>{
        startX=e.clientX; startY=e.clientY; dragging=true; pointerId=e.pointerId; horizontal=null; moved=false;
        baseX = aberto ? -LARG : 0;
        curX=baseX;
        card.style.transition='none';
        try{ card.setPointerCapture(pointerId); }catch(err){}
      });
      card.addEventListener('pointermove', e=>{
        if(!dragging || e.pointerId!==pointerId) return;
        const dx=e.clientX-startX, dy=e.clientY-startY;
        if(horizontal===null){ if(Math.abs(dx)>6||Math.abs(dy)>6) horizontal=Math.abs(dx)>Math.abs(dy); }
        if(!horizontal && !(aberto && dx > 0)) return;
        moved=true;
        let x=baseX+dx;
        x=Math.max(-LARG, Math.min(0, x));
        curX=x;
        if(Math.abs(x-baseX)>4) wrap.classList.add('active');
        card.style.transform='translateX('+x+'px)';
        setActions(x);
      });
      const fim=e=>{
        if(!dragging || (e && e.pointerId!==pointerId)) return;
        dragging=false;
        if(pointerId!=null){ try{ card.releasePointerCapture(pointerId); }catch(err){} }
        card.style.transition='transform .2s ease';
        if(horizontal || (aberto && moved)){
          aberto = curX<=-LARG*.4;
          if(aberto && navigator.vibrate) navigator.vibrate(6);
        }
        const finalX = aberto ? -LARG : 0;
        card.style.transform='translateX('+finalX+'px)';
        acoes.style.transition='opacity .2s ease';
        setActions(finalX);
        card.style.touchAction = aberto ? 'none' : 'pan-y';
        if(!aberto) setTimeout(()=>{ wrap.classList.remove('active'); }, 200);
        horizontal=null;
      };
      card.addEventListener('pointerup', fim);
      card.addEventListener('pointercancel', fim);
      /* Suprime o clique (abrir o trabalho) quando o gesto que acabou de
         terminar foi um arrasto, não um toque — sem isto, soltar o dedo
         depois de revelar o botão também disparava o onclick do card. */
      card.addEventListener('click', e=>{ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } }, true);
    });
  }
  function atualizarNotifDot(){
    const naoVistas = gerarNotificacoes().filter(it=>!notifSeenIds.has(it.id)).length
      + gerarAtividadeCliente().filter(a=>!notifSeenIds.has(a.id)).length;
    const txt = naoVistas>99 ? '99+' : String(naoVistas);
    document.querySelectorAll('.notif-dot').forEach(dot=>{
      dot.style.display = naoVistas>0 ? 'flex' : 'none';
      dot.textContent = txt;
    });
    /* barra superior mobile: sem badge/bolinha — só ícone + número como texto */
    document.querySelectorAll('.notif-count').forEach(el=>{
      el.style.display = naoVistas>0 ? 'inline' : 'none';
      el.textContent = txt;
    });
  }
  /* Detalhe da parcela — visualizar/baixar/substituir comprovante. Deixou de
     ser um botão permanente no card (poluição visual); só aparece ao abrir
     esta ficha. */
  function abrirDetalheParcela(jobId, i){
    const job=jobsData[jobId]; const p=job.payments[i];
    if(!p) return;
    const vencTxt = p.dueDate ? p.dueDate.split('-').reverse().join('/') : '—';
    const pagoTxt = p.pagoEm ? p.pagoEm.split('-').reverse().join('/') : null;
    let html='<div class="u-hint-bare u-lh-185 u-mb-12">';
    html+='<div><span class="u-c-neutral">'+t('job.value')+':</span> '+fmtMoney(p.amount)+'</div>';
    html+='<div><span class="u-c-neutral">'+t('payment.dueOn')+':</span> '+vencTxt+'</div>';
    if(pagoTxt) html+='<div><span class="u-c-neutral">'+t('payment.paidOn')+':</span> '+pagoTxt+'</div>';
    html+='</div>';
    const temComprovante = p.comprovativo && p.comprovativo.startsWith('data:');
    if(temComprovante){
      if(p.comprovativo.startsWith('data:image/')) html+='<img src="'+p.comprovativo+'" style="width:100%;border-radius:var(--r);margin-bottom:12px">';
      html+='<a href="'+p.comprovativo+'" download class="btn soft" style="width:100%;display:block;text-align:center;margin-bottom:8px">'+t('payment.downloadReceipt')+'</a>';
    } else {
      html+='<p style="font-size:13px;color:var(--neutral);margin-bottom:12px">'+t('payment.noReceiptYet')+'</p>';
    }
    html+='<input type="file" id="detalhe-parc-file" accept="image/*,.pdf" class="u-hidden" onchange="substituirComprovanteParcela(\''+jobId+'\','+i+')">';
    html+='<button class="btn ghost u-w-full" onclick="document.getElementById(\'detalhe-parc-file\').click()">'+t('payment.replaceReceipt')+'</button>';
    if(p.status!=='pago') html+='<button class="btn primary u-w-full u-mt-8" onclick="closeInfo();marcarPagoDynamic(\''+jobId+'\','+i+')">'+t('action.complete')+'</button>';
    openInfo(t('payment.detailTitle'), html);
  }
  async function substituirComprovanteParcela(jobId, i){
    const fileEl=document.getElementById('detalhe-parc-file');
    const file=fileEl && fileEl.files[0];
    if(!file) return;
    const job=jobsData[jobId];
    let dataUrl;
    try{ dataUrl=await arquivoParaDataUrlComprimido(file); }catch(e){ showToast(t('toast.uploadFileFirst')); return; }
    job.payments[i].comprovativo=dataUrl;
    saveJobsData();
    closeInfo();
    renderJobDetailDynamic(jobId);
    showToast(t('toast.changesSaved'));
  }


  /* ===== SISTEMA DE I18N — /locales/*.json ===== */
  function clienteSetIdioma(nome){
    perfilData.idiomaPortal=nome;
    perfilData.idiomaPortalCustom=true;
    savePerfilData();
    atualizarBotoesIdiomaPortal();
    if(clientContext) renderClientDynamic(clientContext);
  }
  function atualizarBotoesIdiomaPortal(){
    const langMap={'Português':'pt','English':'en','Español':'es'};
    const lang=langMap[perfilData.idiomaPortal]||'pt';
    document.getElementById('cwlang-pt').classList.toggle('active', lang==='pt');
    document.getElementById('cwlang-en').classList.toggle('active', lang==='en');
    document.getElementById('cwlang-es').classList.toggle('active', lang==='es');
  }
  function renderClientDynamic(id){
    const job=jobsData[id];
    let html='';
    if(job.contract.status==='assinado'){
      html+='<div class="brandhead"><div class="blogo">B</div><div class="who">'+escapeHtml(perfilData.empresa)+'</div><h2>'+escapeHtml(job.typeLabel)+'</h2></div>';
      html+='<div class="nextstep"><div class="lbl">'+tp('portal.contract')+'</div><h3><span class="sig-tag green">'+tp('portal.signed')+'</span></h3><p class="u-label u-op-75 u-mt-n6">'+tp('portal.signedBy')+' '+escapeHtml(job.contract.signerName)+' · '+job.contract.signedAt+'.</p></div>';
      if(job.structure.briefing && job.briefing && !job.briefing.respondido){
        const totalPassos = (job.briefing.cronograma?1:0) + (job.briefing.pessoasImportantes!=null?1:0) + 1;
        let passo=1;
        html+='<div class="briefing-intro"><h3>'+tp('portal.oneMoreThing')+'</h3><p>'+totalPassos+' '+tp('portal.quickSteps')+'</p></div>';

        if(job.briefing.cronograma){
          html+='<div class="briefing-card"><div class="briefing-card-head"><span class="briefing-step">'+(passo++)+'</span>'+tp('portal.eventSchedule')+'</div>';
          html+='<p class="briefing-card-hint">'+tp('portal.scheduleHint')+'</p>';
          html+='<div class="cron-rows" id="cron-rows">';
          job.briefing.cronograma.forEach((m,i)=>{
            html+='<div class="cron-row"><input class="cron-desc" value="'+escapeHtml(m.momento)+'" placeholder="'+tp('portal.moment')+'"><input type="time" class="cron-hora" value="'+escapeHtml(m.hora||'')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cron-rm" onclick="this.closest(\'.cron-row\').remove()"><path d="M18 6 6 18M6 6l12 12"/></svg></div>';
          });
          html+='</div>';
          html+='<button class="btn ghost u-w-full u-mt-4" onclick="adicionarMomentoCronograma()">'+tp('portal.addMoment')+'</button>';
          html+='</div>';
        }

        if(job.briefing.pessoasImportantes!=null){
          html+='<div class="briefing-card"><div class="briefing-card-head"><span class="briefing-step">'+(passo++)+'</span>'+tp('portal.keyPeople')+'</div>';
          html+='<p class="briefing-card-hint">'+tp('portal.keyPeopleHint')+'</p>';
          html+='<div id="cw-pessoas-lista"></div>';
          html+='<div class="field-row"><div class="field"><label>'+tp('portal.name')+'</label><input id="cw-conv-nome" placeholder="'+tp('portal.namePlaceholder')+'"></div>'+
            '<div class="field"><label>'+tp('portal.role')+'</label><input id="cw-conv-funcao" placeholder="'+tp('portal.rolePlaceholder')+'"></div></div>';
          html+='<button class="btn soft u-w-full" onclick="adicionarPessoaImportanteCliente(\''+id+'\')">'+tp('portal.addPerson')+'</button>';
          html+='</div>';
        }

        html+='<div class="briefing-card"><div class="briefing-card-head"><span class="briefing-step">'+(passo++)+'</span>'+tp('portal.importantNotes')+'</div>';
        html+='<div class="field"><textarea id="cw-observacoes" placeholder="'+tp('portal.notesPlaceholder')+'">'+escapeHtml(job.briefing.observacoes||'')+'</textarea></div>';
        html+='</div>';

        html+='<button class="btn primary u-w-full u-mt-6" onclick="enviarBriefingCliente(\''+id+'\')">'+tp('portal.sendAnswers')+'</button>';
      } else {
        if(job.structure.briefing && job.briefing && job.briefing.respondido){
          html+='<div class="csec-label u-mt-18">'+tp('portal.clientInfo')+'</div>';
          html+='<div class="crow"><div class="ci ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></div><div class="crow-b"><div class="t">'+tp('portal.answered')+'</div><div class="m">'+tp('portal.thankYou')+'</div></div></div>';
        }
        html+=construirEmailUniversal(job,'contratoAssinado');
        html+='<button class="btn soft u-w-full u-mt-14" onclick="descarregarCopiaContrato(\''+id+'\')">'+tp('portal.downloadContract')+'</button>';
      }
    } else {
      html+='<div class="brandhead"><div class="blogo">B</div><div class="who">'+escapeHtml(perfilData.empresa)+'</div><h2>'+escapeHtml(job.typeLabel)+'</h2></div>';
      const pendentesCliente=camposClientePendentes(job);
      if(pendentesCliente.length){
        /* Assinatura Inteligente: as variáveis do CLIENTE nunca são pedidas ao
           criador do contrato — só aqui, ao cliente, antes de ele ver o
           contrato final e assinar (ver camposClientePendentes/
           confirmarFormularioCliente). */
        html+=renderFormularioClienteHtml(job,'cwcf-');
        html+='<button class="btn primary u-w-full u-mt-6" onclick="confirmarFormularioClienteESeguir(\''+id+'\')">'+t('action.confirmAndContinue')+'</button>';
      } else {
      html+='<div class="csec-label">'+tp('portal.contract')+'</div>';
      job.contract.blocks.filter(b=>b.on).forEach((b)=>{
        html+='<div class="sec" data-bi="'+b.id+'"><div class="sec-head" onclick="toggleSec(this)"><div class="sec-l"><div class="sec-title">'+escapeHtml(blockName(b))+'</div></div><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div><div class="sec-body"><p class="u-hint-bare u-lh-155">'+escapeHtml(blockText(job,b))+'</p></div></div>';
      });
      html+='<div class="csec-label u-mt-18">'+tp('portal.signerDetails')+'</div>';
      html+='<p style="font-size:12px;color:var(--neutral);margin:-6px 2px 12px">'+tp('portal.notNecessarily')+' '+escapeHtml(job.client)+' '+tp('portal.writeSignerName')+'</p>';
      html+='<div class="field"><label>'+tp('portal.fullName')+'</label><input id="sig-nome" placeholder="'+tp('portal.namePlaceholder2')+'"></div>';
      /* Documento de identificação — só aparece se o profissional ligou o
         toggle "Exigir documento" na Etapa Contrato do wizard. O número
         entra no hash do documento e na folha de prova (ver
         capturarMetadadosAssinatura/assinarContratoCliente), não é
         decorativo como o antigo campo opcional de NIF que existia aqui. */
      if(job.contract.exigirDocumento){
        html+='<div class="field-row"><div class="field" style="flex:0 0 118px"><label>'+tp('portal.docType')+'</label><select id="sig-doc-tipo">'+
          '<option value="'+tp('portal.docTypeNational')+'">'+tp('portal.docTypeNational')+'</option>'+
          '<option value="'+tp('portal.docTypeCpf')+'">'+tp('portal.docTypeCpf')+'</option>'+
          '<option value="'+tp('portal.docTypePassport')+'">'+tp('portal.docTypePassport')+'</option>'+
          '<option value="'+tp('portal.docTypeOther')+'">'+tp('portal.docTypeOther')+'</option>'+
          '</select></div><div class="field u-flex-1"><label>'+tp('portal.docNumber')+'</label><input id="sig-doc-numero" placeholder="'+tp('portal.docNumberPlaceholder')+'"></div></div>';
      }
      html+='<label style="display:flex;gap:9px;align-items:flex-start;font-size:13px;color:var(--ink-soft);margin:14px 2px"><input class="u-check" type="checkbox" id="sig-aceite1"> '+tp('portal.acceptTerms')+'</label>';
      html+='<label style="display:flex;gap:9px;align-items:flex-start;font-size:13px;color:var(--ink-soft);margin:0 2px 16px"><input class="u-check" type="checkbox" id="sig-aceite2"> '+tp('portal.confirmData')+'</label>';
      html+='<div class="field"><label>'+tp('portal.signatureLabel')+'</label>'+
        '<div class="sig-pad-wrap"><canvas id="sig-canvas-cliente"></canvas><span class="sig-pad-clear" onclick="limparAssinaturaCanvasCliente()">'+tp('portal.clear')+'</span></div></div>';
      html+='<label style="display:flex;gap:9px;align-items:flex-start;font-size:12.5px;color:var(--ink-soft);margin:0 2px 16px">'+
        '<input class="u-check" type="checkbox" id="sig-geo-opt"> '+tp('portal.allowLocation')+'</label>';
      html+='<button class="btn primary u-w-full" onclick="assinarContratoCliente(\''+id+'\')">'+tp('portal.sign')+'</button>';
      }
    }
    document.getElementById('client-dynamic').innerHTML=html;
    if(job.briefing && job.briefing.pessoasImportantes!=null && !job.briefing.respondido) renderPessoasImportantesLista(id);
    if(job.contract.status!=='assinado' && !camposClientePendentes(job).length) setTimeout(inicializarCanvasAssinaturaCliente, 30);
  }
  function confirmarFormularioClienteESeguir(id){
    const job=jobsData[id];
    if(!confirmarFormularioCliente(job,'cwcf-')){ clientToast(t('toast.clientFormIncomplete')); return; }
    saveJobsData();
    renderClientDynamic(id);
  }
  function renderPessoasImportantesLista(id){
    const job=jobsData[id];
    const wrap=document.getElementById('cw-pessoas-lista');
    if(!wrap) return;
    const lista=job.briefing.pessoasImportantes||[];
    wrap.innerHTML = lista.length ? lista.map((c,i)=>
      '<div class="conv-row"><div class="conv-av">'+avatarHtml(c.nome,32)+'</div>'+
      '<div class="conv-info"><div class="nm">'+escapeHtml(c.nome)+'</div><div class="sub">'+escapeHtml(c.funcao)+'</div></div>'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="conv-rm" onclick="removerPessoaImportanteCliente(\''+id+'\','+i+')"><path d="M18 6 6 18M6 6l12 12"/></svg></div>'
    ).join('') : '<p class="u-sm-nd u-mb-10">Ainda sem pessoas adicionadas.</p>';
  }
  function adicionarPessoaImportanteCliente(id){
    const job=jobsData[id];
    const nome=document.getElementById('cw-conv-nome').value.trim();
    const funcao=document.getElementById('cw-conv-funcao').value.trim();
    if(!nome || !funcao){ clientToast('Escreve o nome e a função.'); return; }
    job.briefing.pessoasImportantes.push({nome, funcao});
    document.getElementById('cw-conv-nome').value='';
    document.getElementById('cw-conv-funcao').value='';
    renderPessoasImportantesLista(id);
    saveJobsData();
    clientToast('Pessoa adicionada.');
  }
  function removerPessoaImportanteCliente(id, i){
    jobsData[id].briefing.pessoasImportantes.splice(i,1);
    renderPessoasImportantesLista(id);
    saveJobsData();
  }
  function adicionarMomentoCronograma(){
    const wrap=document.getElementById('cron-rows');
    const row=document.createElement('div');
    row.className='cron-row';
    row.innerHTML='<input class="cron-desc" placeholder="Momento"><input type="time" class="cron-hora"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cron-rm" onclick="this.closest(\'.cron-row\').remove()"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    wrap.appendChild(row);
    row.querySelector('.cron-desc').focus();
  }
  function enviarBriefingCliente(id){
    const job=jobsData[id];
    job.briefing.perguntas.forEach((p,i)=>{
      const el=document.getElementById('brief-'+i);
      p.r = el? el.value.trim() : '';
    });
    if(job.briefing.cronograma){
      const linhas=document.querySelectorAll('#cron-rows .cron-row');
      job.briefing.cronograma = [...linhas].map(row=>({
        momento: row.querySelector('.cron-desc').value.trim(),
        hora: row.querySelector('.cron-hora').value
      })).filter(m=>m.momento);
    }
    const obsEl=document.getElementById('cw-observacoes');
    if(obsEl) job.briefing.observacoes=obsEl.value.trim();
    job.briefing.respondido=true;
    pushHistory(job,t('history.clientAnsweredBriefing'), 'cliente');
    saveJobsData();
    renderClientDynamic(id);
    clientToast('Respostas enviadas. Obrigado!');
  }
