/*
  Card Tarefas 01 — Carrossel horizontal (implementação anterior)
  Extraído de index.html, seção CARROSSEL DE TAREFAS (linhas ~4797–5237)
  Substituído pelo sistema de stack (tsk-*) no commit de 2026-08.

  Para restaurar:
  1. Substituir a seção TASK STACK em dashboard.css pelo conteúdo de carousel.css
  2. Substituir a seção TASK STACK em index.html por este arquivo
  3. Restaurar a função renderTasksList() conforme o trecho abaixo
*/

  // ---- renderTasksList (trecho a substituir dentro da função) ----
  // Substituir a linha:
  //   wrap.innerHTML='<div class="tsk-stack" ...>'; ativarStackTarefas();
  // por:
  //   const svgPrev='<svg viewBox="0 0 8 14" ...>...</svg>';
  //   const svgNext='<svg viewBox="0 0 8 14" ...>...</svg>';
  //   wrap.innerHTML='<div class="tc-viewport" id="tc-viewport"><div class="tc-track" id="tc-track">'+itens.map(construirCarouselCard).join('')+'</div></div>'+
  //     '<div class="tc-nav-prev" id="tc-nav-prev">'+svgPrev+'</div>'+
  //     '<div class="tc-nav-next" id="tc-nav-next">'+svgNext+'</div>';
  //   ativarCarrosselTarefas();

  /* ===== CARROSSEL DE TAREFAS ===== */
  const TC_MESES=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  function construirCarouselCard(it){
    const partes=it.dataISO.split('-');
    const mes=TC_MESES[parseInt(partes[1],10)-1]||partes[1];
    const foto=clienteFotoPorNome(it.cliente);
    const solto=it.tipo==='lembrete'||it.tipo==='lista'||it.tipo==='tarefa';
    const fotoHtml=avatarHtml(it.cliente||it.nome,220,foto);
    const clienteHtml='<div class="tc-client-row">'+
      (it.cliente ? RTK_ICONS.client+'<span>'+escapeHtml(it.cliente)+'</span>' : '')+
      '</div>';
    const icoEdit='<svg viewBox="0 0 11 11" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1.5L9.5 4 3.5 10H1V7.5L7 1.5z"/></svg>';
    const icoArch='<svg viewBox="0 0 11 11" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="1" y="4" width="9" height="6" rx="1"/><path d="M1 2h9v2H1z" fill="currentColor" stroke="none"/><path d="M3.5 7h4" stroke-linecap="round"/></svg>';
    const icoDone='<svg viewBox="0 0 11 11" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 5.5l3 3L9.5 2"/></svg>';
    const icoCalSmall='<svg class="tc-ico" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"><rect x="1" y="2.5" width="10" height="8.5" rx="1.5"/><path d="M4 1.5V3M8 1.5V3M1 5.5h10"/></svg>';
    const icoClockSmall='<svg class="tc-ico" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l2 1.5"/></svg>';
    return '<div class="tc-slide" data-task data-job-id="'+(it.jobId||'')+'" data-tipo="'+it.tipo+'" data-idx="'+(it.idx!=null?it.idx:'')+'" data-solto="'+solto+'">'+
      '<div class="tc-layer-t">'+
        '<div class="tc-photo-area">'+fotoHtml+'</div>'+
        '<div class="tc-info-area">'+
          '<div class="tc-title">'+escapeHtml(it.nome)+'</div>'+
          clienteHtml+
        '</div>'+
      '</div>'+
      '<div class="tc-layer-b">'+
        '<div class="tc-actions-row">'+
          '<button class="tc-btn tc-btn-edit" onclick="event.stopPropagation();tcEditar(this)">'+icoEdit+'EDITAR</button>'+
          '<button class="tc-btn tc-btn-arch" onclick="event.stopPropagation();tcArquivar(this)">'+icoArch+'ARQUIVAR</button>'+
          '<button class="tc-btn tc-btn-done" onclick="event.stopPropagation();tcConcluir(this)">'+icoDone+'CONCLUIR</button>'+
        '</div>'+
        '<div class="tc-datetime-row">'+
          '<div class="tc-dt-left">'+icoCalSmall+
            '<div class="tc-date-stack"><b class="tc-d-num">'+partes[2]+'</b><span class="tc-d-mon">'+mes+'</span></div>'+
          '</div>'+
          '<div class="tc-dt-sep"></div>'+
          '<div class="tc-dt-right">'+icoClockSmall+
            '<div class="tc-time-stack">'+
              '<span class="tc-time-in">'+(it.hora||'—')+'</span>'+
              '<span class="tc-time-out">'+(it.horaFim||'—')+'</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  function ativarCarrosselTarefas(){
    const viewport=document.getElementById('tc-viewport');
    const track=document.getElementById('tc-track');
    if(!viewport||!track) return;
    const realSlides=Array.from(track.querySelectorAll('.tc-slide'));
    const n=realSlides.length;
    if(!n) return;
    const ACTIONS_H=48, GAP=16;
    const vpW=viewport.offsetWidth||window.innerWidth;
    const MARGIN=Math.round(vpW/4+GAP/2);
    const slideW=vpW-MARGIN*2;
    realSlides.forEach(s=>{s.style.width=slideW+'px';});
    let allSlides=realSlides;
    if(n>1){
      const cLast=realSlides[n-1].cloneNode(true);
      const cFirst=realSlides[0].cloneNode(true);
      track.insertBefore(cLast,realSlides[0]);
      track.appendChild(cFirst);
      allSlides=Array.from(track.querySelectorAll('.tc-slide'));
      allSlides.forEach(s=>{s.style.width=slideW+'px';});
    }
    let virtual=n>1?1:0;
    let startX=0,startY=0,dragging=false,pointerId=null,dragOffset=0,lastTap=0,tapTimer=0;
    const prevArrow=document.getElementById('tc-nav-prev');
    const nextArrow=document.getElementById('tc-nav-next');
    const posFor=v=>MARGIN-v*(slideW+GAP);
    const updateOpacity=()=>{
      allSlides.forEach((s,i)=>{
        const active=i===virtual;
        s.style.opacity=active?'1':'0.5';
        s.style.filter=active?'none':'brightness(0.6)';
        s.style.transition='opacity .35s ease,filter .35s ease';
      });
      if(prevArrow) prevArrow.style.opacity=n>1?'.16':'0';
      if(nextArrow) nextArrow.style.opacity=n>1?'.16':'0';
    };
    const goTo=(v,animate=true)=>{
      virtual=v;
      allSlides.forEach((s,i)=>{s.style.zIndex=i===v?'2':'1';});
      track.style.transition=animate?'transform .35s cubic-bezier(.25,.1,.25,1)':'none';
      track.style.transform='translateX('+posFor(v)+'px)';
      updateOpacity();
    };
    if(n>1){
      track.addEventListener('transitionend',()=>{
        if(virtual===0)   goTo(n,false);
        if(virtual===n+1) goTo(1,false);
      });
    }
    const setOpen=(slide,open)=>{
      const lt=slide.querySelector('.tc-layer-t');
      if(!lt) return;
      lt.style.transform=open?'translateY(-'+ACTIONS_H+'px)':'translateY(0)';
      slide.dataset.tcOpen=open?'1':'';
    };
    goTo(n>1?1:0,false);
    viewport.addEventListener('pointerdown',e=>{
      startX=e.clientX; startY=e.clientY;
      dragging=true; pointerId=e.pointerId; dragOffset=0;
      track.style.transition='none';
      try{viewport.setPointerCapture(e.pointerId);}catch(err){}
    });
    viewport.addEventListener('pointermove',e=>{
      if(!dragging||e.pointerId!==pointerId) return;
      const dx=e.clientX-startX;
      const dy=e.clientY-startY;
      if(Math.abs(dy)>Math.abs(dx)+8) return;
      dragOffset=dx;
      track.style.transform='translateX('+(posFor(virtual)+dx)+'px)';
    });
    const fim=e=>{
      if(!dragging||(e&&e.pointerId!==pointerId)) return;
      dragging=false;
      const THRESHOLD=52;
      if(Math.abs(dragOffset)<8){
        const now=Date.now();
        if(now-lastTap<320){
          clearTimeout(tapTimer);
          lastTap=0;
          const sl=allSlides[virtual];
          if(sl){
            setOpen(sl,false);
            if(sl.dataset.solto==='true') abrirDetalheItemSolto(sl.dataset.tipo,sl.dataset.idx);
            else openJob(sl.dataset.jobId);
          }
        } else {
          lastTap=now;
          tapTimer=setTimeout(()=>{
            const sl=allSlides[virtual];
            if(sl) setOpen(sl,sl.dataset.tcOpen!=='1');
          },300);
        }
      } else if(dragOffset<-THRESHOLD) goTo(virtual+1);
      else if(dragOffset>THRESHOLD) goTo(virtual-1);
      else goTo(virtual);
    };
    viewport.addEventListener('pointerup',fim);
    viewport.addEventListener('pointercancel',fim);
  }

  function tcEditar(btn){
    const sl=btn.closest('.tc-slide');
    if(sl.dataset.solto==='true') abrirDetalheItemSolto(sl.dataset.tipo,sl.dataset.idx);
    else openJob(sl.dataset.jobId);
  }
  function tcArquivar(btn){
    const sl=btn.closest('.tc-slide');
    _tcArquivados.add((sl.dataset.jobId||sl.dataset.tipo||'')+'_'+(sl.dataset.idx||''));
    renderTasksList();
    showToast(t('toast.archivedFromRadar'));
  }
  function tcConcluir(btn){
    const sl=btn.closest('.tc-slide');
    const tipo=sl.dataset.tipo,idx=sl.dataset.idx,jobId=sl.dataset.jobId;
    if(tipo==='lembrete'){if(lembretesData[idx]){lembretesData[idx].feito=true;saveLembretesData();}}
    else if(tipo==='lista'){if(listasData[idx]){listasData[idx].feito=true;saveListasData();}}
    else if(tipo==='tarefa'){if(tarefasData[idx]){tarefasData[idx].feito=true;saveTarefasData();}}
    else{
      const job=jobsData[jobId];
      if(!job){showToast(t('toast.jobNotFound'));return;}
      if(tipo==='pagamento') marcarPagoDynamic(jobId,parseInt(idx,10));
      else if(tipo==='contrato'){openJob(jobId);return;}
      else{const ms=(job.milestones||[]).find(m=>m.key==='principal');if(ms){ms.status='feito';ms.feitoEm=new Date().toISOString();pushHistory(job,t('toast.markedDone'));saveJobsData();}}
    }
    renderTasksList();
    renderMonthTicker();
    showToast(t('toast.done'));
  }
  /* ===== FIM CARROSSEL ===== */
