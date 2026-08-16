/* CARD PROJETOS 01 — JS de renderização original
   Arquivo de referência. Copiado de index.html antes do redesign.
   Interação: swipe esquerda = editar, swipe direita = concluir/arquivar
   Double-tap = abrir projeto, single-tap = revelar ações. */

function renderJobCard(job){
  const existente=document.querySelector('.job[data-job-id="'+job.id+'"]');
  if(existente){ const w=existente.closest('.job-card-wrap'); (w||existente).remove(); }
  if(job.arquivado) return;
  const wrap=document.createElement('div');
  wrap.className='job-card-wrap radar-card-wrap';
  wrap.innerHTML='<div class="radar-swipe-actions left">'+
      '<button class="radar-swipe-btn editar" onclick="event.stopPropagation();openJob(\''+job.id+'\')">EDITAR</button>'+
    '</div>'+
    '<div class="radar-swipe-actions right">'+
      '<button class="radar-swipe-btn concluir" onclick="event.stopPropagation();arquivarTrabalho(\''+job.id+'\',\'concluido\')">CONCLUIR</button>'+
      '<button class="radar-swipe-btn arquivar" onclick="event.stopPropagation();confirmarDeletarTrabalho(\''+job.id+'\')">ARQUIVAR</button>'+
    '</div>';
  const div=document.createElement('div');
  div.className='job radar-card';
  div.dataset.jobId=job.id;
  div.setAttribute('onclick',"onJobCardClick(event,this)");
  updateJobCardInner(div, job);
  wrap.appendChild(div);
  inserirJobCardOrdenado(wrap, job);
  ativarSwipeRadar();
}

/* Double-tap = abrir, single-tap = toggle ações */
function onJobCardClick(e, card){
  if(card.dataset.swiped==='1'){ e.preventDefault(); e.stopPropagation(); return; }
  const id=card.dataset.jobId;
  const now=Date.now();
  const last=_jobLastTap[id]||0;
  if(now-last<320){
    clearTimeout(_jobTapTimers[id]);
    _jobLastTap[id]=0;
    setJobOpen(card,false);
    openJob(id);
  } else {
    _jobLastTap[id]=now;
    _jobTapTimers[id]=setTimeout(()=>{
      setJobOpen(card, card.dataset.jobOpen!=='1');
    },300);
  }
}

/* HTML interno — duas camadas: head-row (preto) + body-rows (vidro) */
function updateJobCardInner(div, job){
  /* ... sets dataset.state, className, etc. then: */
  div.innerHTML='<div class="job-head-row">'+avatarHtml(job.client,44,clienteFotoPorNome(job.client))+
    '<div class="job-head-info"><div class="job-title">'+escapeHtml(job.nome||job.typeLabel||'')+'</div>'+
    '<div class="job-client-name">'+RTK_ICONS.client+'<span>'+escapeHtml(job.client)+'</span></div></div></div>'+
    '<div class="job-body-rows">'+
      '<div class="job-act-section"><div class="tc-actions-row">'+
        '<button class="tc-btn tc-btn-edit">EDITAR</button>'+
        '<button class="tc-btn tc-btn-arch">ARQUIVAR</button>'+
        '<button class="tc-btn tc-btn-done">CONCLUIR</button>'+
      '</div></div>'+
      '<div class="job-info-section">'+
        '<div class="job-datetime">[calendar] data</div>'+
        '<div class="job-datetime job-hora">[clock] hora</div>'+
        '<div class="job-stage-row">[icon] etapa</div>'+
      '</div>'+
    '</div>';
}
