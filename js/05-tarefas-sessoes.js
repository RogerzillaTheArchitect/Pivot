/* Pivots — tarefas sessoes
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== TASK STACK ===== */
  const TSK_MESES_PT=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  /* ===== PESSOAS ASSOCIADAS — helpers ===== */
  function nomeMembro(uid){
    if(currentUser && uid===currentUser.id) return perfilData.nome||currentUser.email||'EU';
    const m=membrosEquipa.find(x=>x.user_id===uid);
    return m?(m.email||'?'):'?';
  }
  function buildPessoasHtml(pessoasIds){
    if(!pessoasIds||!pessoasIds.length) return '';
    const MAX=2, extra=pessoasIds.length-MAX;
    let html='';
    pessoasIds.slice(0,MAX).forEach(id=>{
      const nome=id.includes('@')?id.split('@')[0]:nomeMembro(id);
      html+='<div class="tsk-av" title="'+escapeHtml(nome)+'">'+avatarInitials(nome)+'</div>';
    });
    if(extra>0) html+='<div class="tsk-av tsk-av-more">+'+extra+'</div>';
    return html;
  }
  function getPessoasSelecionadas(pickerId){
    const wrap=document.getElementById(pickerId);if(!wrap) return [];
    return [...wrap.querySelectorAll('.pessoa-chip.on')].map(el=>el.dataset.uid);
  }
  /* Notificações de convite de tarefa/lista/trabalho */
  let notificacoesData={};
  function saveNotificacoesData(){ savePersisted('pivot-notificacoesData',()=>notificacoesData); }
  async function loadNotificacoesData(){ await loadPersisted('pivot-notificacoesData',d=>{notificacoesData=d||{};}); }
  function criarNotificacoesPessoas(pessoas, tipo, itemId, itemTitulo){
    if(!pessoas||!pessoas.length) return;
    const deNome=perfilData.nome||currentUser?.email||'Alguém';
    pessoas.forEach(idOrEmail=>{
      let uid=idOrEmail;
      if(idOrEmail.includes('@')){
        const m=(membrosEquipa||[]).find(x=>(x.email||'').toLowerCase()===idOrEmail);
        if(!m) return;
        uid=m.user_id;
      }
      if(uid===currentUser?.id) return;
      const id='notif'+Date.now()+Math.random().toString(36).slice(2,6);
      notificacoesData[id]={id, tipo, itemId, itemTitulo, deNome, paraUserId:uid, estado:'pendente', criadoEm:new Date().toISOString()};
    });
    saveNotificacoesData();
  }
  function responderNotificacao(id, aceitar){
    const n=notificacoesData[id];if(!n) return;
    n.estado=aceitar?'aceito':'recusado';
    saveNotificacoesData();
    renderNotificacoesPendentes();
    if(aceitar) renderTasksList();
  }
  function renderNotificacoesPendentes(){
    const wrap=document.getElementById('notif-pendentes-wrap');if(!wrap) return;
    if(!currentUser) return;
    const pendentes=Object.values(notificacoesData).filter(n=>n.estado==='pendente'&&n.paraUserId===currentUser.id);
    if(!pendentes.length){wrap.innerHTML='';return;}
    wrap.innerHTML=pendentes.map(n=>{
      const tipoLabel=n.tipo==='tarefa'?'tarefa':n.tipo==='lista'?'checklist':'trabalho';
      return '<div class="notif-inv-card">'+
        '<div class="notif-inv-title">'+escapeHtml(n.deNome)+' adicionou você a uma '+tipoLabel+'</div>'+
        '<div class="notif-inv-sub">'+escapeHtml(n.itemTitulo)+'</div>'+
        '<div class="notif-inv-actions">'+
          '<button class="btn primary" onclick="responderNotificacao(\''+n.id+'\',true)">ACEITAR</button>'+
          '<button class="btn soft" onclick="responderNotificacao(\''+n.id+'\',false)">RECUSAR</button>'+
        '</div></div>';
    }).join('');
  }
  /* ===== FIM PESSOAS ===== */

  function construirStackCard(it,idx){
    const foto=clienteFotoPorNome(it.cliente);
    const solto=it.tipo==='lembrete'||it.tipo==='lista'||it.tipo==='tarefa';
    const fotoHtml=avatarHtml(it.cliente||it.nome,88,foto);
    const partes=(it.dataISO||'--').split('-');
    const mes=TSK_MESES_PT[parseInt(partes[1],10)-1]||partes[1]||'—';
    const dia=partes[2]||'—';
    const dataFmt=dia+' '+mes;
    const icoContact='<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/></svg>';
    const icoCal='<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3.5" width="12" height="10" rx="2"/><path d="M5 2v3M11 2v3M2 7.5h12"/></svg>';
    const icoClock='<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="5.5"/><path d="M8 5.5V8l2 1.5"/></svg>';
    const icoLink='<svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 8.5a3 3 0 0 0 4.24 0l2-2A3 3 0 0 0 7.5 2.25l-1.1 1.1"/><path d="M8.5 5.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 0 0 4.25 4.25l1.1-1.1"/></svg>';
    const icoEdit='<svg viewBox="0 0 11 11" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1.5L9.5 4 3.5 10H1V7.5L7 1.5z"/></svg>';
    const icoArch='<svg viewBox="0 0 11 11" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="1" y="4" width="9" height="6" rx="1"/><path d="M1 2h9v2H1z" fill="currentColor" stroke="none"/><path d="M3.5 7h4" stroke-linecap="round"/></svg>';
    const icoDone='<svg viewBox="0 0 11 11" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 5.5l3 3L9.5 2"/></svg>';
    const icoTimer='<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6" cy="7" r="4.2"/><path d="M6 5v2l1.4 1"/><path d="M6 2.8V1.5M4.4 3l-.4-.7"/></svg>';
    /* pessoas associadas */
    let pessoasIds=[];
    if(it.tipo==='tarefa'&&it.idx) pessoasIds=(tarefasData[it.idx]&&tarefasData[it.idx].pessoas)||[];
    else if(it.tipo==='lista'&&it.idx) pessoasIds=(listasData[it.idx]&&listasData[it.idx].pessoas)||[];
    else if(it.jobId) pessoasIds=(jobsData[it.jobId]&&jobsData[it.jobId].pessoas)||[];
    const pessoasHtml=buildPessoasHtml(pessoasIds);
    /* progresso de itens — anel SVG na coluna de tags */
    let progRingTag='';
    if(it.tipo==='lista'&&it.idx){
      const ls=listasData[it.idx];
      if(ls&&ls.itens&&ls.itens.length){
        const f=ls.itens.filter(i=>i.feito).length, tot=ls.itens.length;
        progRingTag=progRingHtml(f,tot);
      }
    } else if(it.tipo==='tarefa'&&it.idx){
      const tk=tarefasData[it.idx];
      if(tk&&tk.itens&&tk.itens.length){
        const f=tk.itens.filter(i=>i.feito).length, tot=tk.itens.length;
        progRingTag=progRingHtml(f,tot);
      }
    }
    /* vínculo com projeto */
    let projHtml='';
    if(it.jobId&&jobsData[it.jobId]){
      const jn=jobsData[it.jobId];
      const jNome=jn.nome||jn.client||'';
      if(jNome) projHtml='<div class="tsk-proj-link">'+icoLink+'<span>'+escapeHtml(jNome)+'</span></div>';
    }
    /* work session indicator */
    var wsTaskIdx=(it.tipo==='evento')?((it.jobId||'')+'_'+(it.hora||'')):(it.idx!=null?it.idx:'');
    var wsKeyVal=_wsKey(it.tipo,wsTaskIdx);
    var wsIsRunning=_wsActive&&_wsActive.key===wsKeyVal;
    var wsSec=wsTotalSec(wsKeyVal)+(wsIsRunning?Math.round((Date.now()-_wsActive.startedAt)/1000):0);
    var wsChipHtml='';
    if(wsIsRunning){
      wsChipHtml='<span class="ws-card-chip ws-card-running" data-ws-key="'+wsKeyVal+'">'+
        '<span class="ws-dot">●</span><span class="ws-card-elapsed">Trabalhando</span></span>';
    } else if(wsSec>0){
      wsChipHtml='<span class="ws-card-chip">'+
        '<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6" cy="7" r="4"/><path d="M6 5.5V7l1 .8"/></svg>'+
        '<span>'+wsFmtDur(wsSec)+'</span></span>';
    }
    /* chips direita: tipo + prazo + anel de progresso */
    const tagsHtml='<div class="tsk-tags">'+tipoChipHtml(it)+prazoChipHtml(it.dataISO)+progRingTag+'</div>';
    const infoClass='tsk-info has-tags'+(pessoasHtml?' has-people':'');
    return '<div class="tsk-card" data-task'+
      ' data-stack-idx="'+idx+'"'+
      ' data-job-id="'+(it.jobId||'')+'"'+
      ' data-tipo="'+it.tipo+'"'+
      ' data-idx="'+(it.idx!=null?it.idx:'')+'"'+
      ' data-hora="'+(it.hora||'')+'"'+
      ' data-solto="'+solto+'">'+
      '<div class="tsk-actions">'+
        '<div class="tsk-act-left">'+
          '<button class="tsk-swipe-btn" onclick="event.stopPropagation();tcEditar(this)">'+icoEdit+'<span>EDITAR</span></button>'+
        '</div>'+
        '<div class="tsk-act-right">'+
          '<button class="tsk-swipe-btn tsk-tempo" onclick="event.stopPropagation();tcTempo(this)">'+icoTimer+'<span>TEMPO</span></button>'+
          '<button class="tsk-swipe-btn" onclick="event.stopPropagation();tcArquivar(this)">'+icoArch+'<span>ARQUIVAR</span></button>'+
          '<button class="tsk-swipe-btn" onclick="event.stopPropagation();tcConcluir(this)">'+icoDone+'<span>CONCLUIR</span></button>'+
        '</div>'+
      '</div>'+
      '<div class="tsk-front">'+
        '<div class="tsk-body">'+
          '<div class="tsk-photo-wrap">'+fotoHtml+'</div>'+
          '<div class="'+infoClass+'">'+
            '<span class="tsk-title">'+escapeHtml(it.nome)+'</span>'+
            wsChipHtml+
            projHtml+
            '<div class="tsk-meta-row">'+icoContact+'<span class="tsk-meta-text">'+(it.cliente?escapeHtml(it.cliente):'—')+'</span></div>'+
            '<div class="tsk-meta-row">'+icoCal+'<span class="tsk-meta-text">'+dataFmt+'</span>'+
              (it.hora?'<span class="tsk-meta-sep">·</span>'+icoClock+'<span class="tsk-meta-text">'+escapeHtml(it.hora)+'</span>':'')+
            '</div>'+
          '</div>'+
        '</div>'+
        tagsHtml+
      '</div>'+
      (pessoasHtml?'<div class="tsk-people">'+pessoasHtml+'</div>':'')+
    '</div>';
  }

  function ativarStackTarefas(){
    const stack=document.getElementById('tsk-stack');
    if(!stack) return;
    const cards=Array.from(stack.querySelectorAll('.tsk-card'));
    const n=cards.length;
    if(!n) return;
    const CARD_H=108,STRIP_H=24,MAX_BACK=2,W_STEP=0.08;
    let ringOffset=0,animating=false;
    let dragging=false,dragAxis=null,pointerId=null;
    let startX=0,startY=0,swipedOpen=false;

    function cardAt(i){return cards[(i+ringOffset)%n];}
    function getFront(){return cardAt(0);}

    function positionCards(animate){
      const backCount=Math.min(n-1,MAX_BACK);
      const containerH=CARD_H+STRIP_H*backCount;
      const tr=animate?'top .18s cubic-bezier(.25,.1,.25,1),width .18s cubic-bezier(.25,.1,.25,1),opacity .18s ease':'none';
      stack.style.transition=animate?'height .18s cubic-bezier(.25,.1,.25,1)':'none';
      stack.style.height=containerH+'px';
      for(let i=0;i<n;i++){
        const card=cardAt(i);
        card.style.transition=tr;
        if(i>MAX_BACK){
          card.style.opacity='0';card.style.pointerEvents='none';
          card.style.zIndex='1';card.style.top='0px';
          card.style.width=((1-W_STEP*MAX_BACK)*100)+'%';
          continue;
        }
        card.style.zIndex=String(n-i);
        card.style.pointerEvents=i<=1?'auto':'none';
        if(i===0){
          card.style.top=STRIP_H*backCount+'px';card.style.width='100%';card.style.opacity='1';
        } else {
          card.style.top=STRIP_H*(backCount-i)+'px';
          card.style.width=((1-W_STEP*i)*100)+'%';
          card.style.opacity=String(Math.max(0.82,1-0.07*i));
        }
      }
    }

    function snapClose(animate){
      const front=getFront();if(!front) return;
      const f=front.querySelector('.tsk-front');
      if(f){f.classList.remove('tsk-dragging');f.style.transition=animate?'transform .15s cubic-bezier(.25,.1,.25,1)':'none';f.style.transform='translateX(0)';}
      const act=front.querySelector('.tsk-actions');
      if(act) act.classList.remove('tsk-vis');
      swipedOpen=false;
    }

    function advance(){
      if(animating||n<=1) return;
      animating=true;snapClose(false);
      const oldFront=cardAt(0);
      const backCount=Math.min(n-1,MAX_BACK);
      const containerH=CARD_H+STRIP_H*backCount;
      oldFront.style.transition='top .18s cubic-bezier(.25,.1,.25,1),opacity .18s ease';
      oldFront.style.top=(containerH+20)+'px';
      oldFront.style.opacity='0';oldFront.style.zIndex='0';
      ringOffset=(ringOffset+1)%n;
      const tr='top .18s cubic-bezier(.25,.1,.25,1),width .18s cubic-bezier(.25,.1,.25,1),opacity .18s ease';
      stack.style.height=containerH+'px';
      for(let i=0;i<n;i++){
        const card=cardAt(i);if(card===oldFront) continue;
        card.style.transition=tr;
        if(i>MAX_BACK){card.style.opacity='0';card.style.pointerEvents='none';card.style.zIndex='1';card.style.top='0px';card.style.width=((1-W_STEP*MAX_BACK)*100)+'%';continue;}
        card.style.zIndex=String(n-i);card.style.pointerEvents=i<=1?'auto':'none';
        if(i===0){card.style.top=STRIP_H*backCount+'px';card.style.width='100%';card.style.opacity='1';}
        else{card.style.top=STRIP_H*(backCount-i)+'px';card.style.width=((1-W_STEP*i)*100)+'%';card.style.opacity=String(Math.max(0.82,1-0.07*i));}
      }
      setTimeout(()=>{
        oldFront.style.transition='none';oldFront.style.top='0px';oldFront.style.opacity='0';
        positionCards(false);animating=false;
      },200);
    }

    function goBack(){
      if(animating||n<=1) return;
      animating=true;snapClose(false);
      ringOffset=(ringOffset-1+n)%n;
      const newFront=cardAt(0);
      const backCount=Math.min(n-1,MAX_BACK);
      const containerH=CARD_H+STRIP_H*backCount;
      newFront.style.transition='none';newFront.style.top=(containerH+20)+'px';newFront.style.opacity='0';
      newFront.getBoundingClientRect();
      positionCards(true);
      setTimeout(()=>{animating=false;},200);
    }

    document.addEventListener('pointerdown',function(e){
      if(!swipedOpen) return;
      const fc=getFront();
      if(fc&&!fc.contains(e.target)) snapClose(true);
    },{passive:true});

    stack.addEventListener('pointerdown',e=>{
      if(animating) return;
      const card=e.target.closest('.tsk-card');
      if(!card) return;
      let vi=-1;for(let i=0;i<n;i++){if(cardAt(i)===card){vi=i;break;}}
      if(vi>0){advance();return;}
      if(vi<0) return;
      dragging=true;dragAxis=null;pointerId=e.pointerId;
      startX=e.clientX;startY=e.clientY;
      try{stack.setPointerCapture(e.pointerId);}catch(err){}
    });

    stack.addEventListener('pointermove',e=>{
      if(!dragging||e.pointerId!==pointerId) return;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      if(!dragAxis){
        if(Math.abs(dx)>12||Math.abs(dy)>12) dragAxis=Math.abs(dx)>Math.abs(dy)*1.8?'h':'v';
        else return;
      }
      if(dragAxis==='h'){
        const card=getFront();const front=card&&card.querySelector('.tsk-front');
        if(!front) return;
        front.classList.add('tsk-dragging');front.style.transform='translateX('+dx+'px)';
        const act=card.querySelector('.tsk-actions');
        if(act) act.classList.toggle('tsk-vis',Math.abs(dx)>8);
      }
    });

    stack.addEventListener('pointerup',e=>{
      if(!dragging||e.pointerId!==pointerId) return;
      dragging=false;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      const card=getFront();
      if(dragAxis==='h'){
        const front=card&&card.querySelector('.tsk-front');
        if(front) front.classList.remove('tsk-dragging');
        const cardW=card?card.offsetWidth:300;
        const snapR=Math.round(cardW*0.75),snapL=Math.round(cardW*0.25);
        if(dx<-60){
          if(front){front.style.transition='transform .3s cubic-bezier(.25,.1,.25,1)';front.style.transform='translateX(-'+snapR+'px)';}
          const act=card&&card.querySelector('.tsk-actions');if(act) act.classList.add('tsk-vis');
          swipedOpen=true;
        } else if(dx>60){
          if(front){front.style.transition='transform .3s cubic-bezier(.25,.1,.25,1)';front.style.transform='translateX('+snapL+'px)';}
          const act=card&&card.querySelector('.tsk-actions');if(act) act.classList.add('tsk-vis');
          swipedOpen=true;
        } else {snapClose(true);}
      } else if(dragAxis==='v'){
        if(dy>50) advance();
        else if(dy<-50) goBack();
      } else if(Math.abs(dx)<8&&Math.abs(dy)<8){
        if(swipedOpen){snapClose(true);return;}
        if(card){
          if(card.dataset.solto==='true') abrirDetalheItemSolto(card.dataset.tipo,card.dataset.idx);
          else openJob(card.dataset.jobId);
        }
      }
      dragAxis=null;
    });

    stack.addEventListener('pointercancel',e=>{
      if(!dragging||e.pointerId!==pointerId) return;
      dragging=false;dragAxis=null;snapClose(true);
    });

    stack.addEventListener('touchmove',e=>{
      const fc=getFront();if(fc&&fc.contains(e.target)) e.preventDefault();
    },{passive:false});

    positionCards(false);
  }

  function tcEditar(btn){
    const sl=btn.closest('.tsk-card');
    if(sl.dataset.solto==='true') abrirDetalheItemSolto(sl.dataset.tipo,sl.dataset.idx);
    else openJob(sl.dataset.jobId);
  }
  function tcArquivar(btn){
    const sl=btn.closest('.tsk-card');
    _tcArquivados.add((sl.dataset.jobId||sl.dataset.tipo||'')+'_'+(sl.dataset.idx||''));
    renderTasksList();
    showToast(t('toast.archivedFromRadar'));
  }
  function tcConcluir(btn){
    const sl=btn.closest('.tsk-card');
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

  /* ===== WORK SESSIONS — cronômetro por tarefa ===== */
  function _wsPad(n){return n<10?'0'+n:String(n);}
  var worksessionsData={};
  var _wsActive=null; /* { key, nome, jobId, startedAt(ms), tickId } */

  function _wsLoad(){ try{ worksessionsData=JSON.parse(localStorage.getItem('pivot_worksessions')||'{}'); }catch(e){ worksessionsData={}; } }
  function _wsSave(){ try{ localStorage.setItem('pivot_worksessions',JSON.stringify(worksessionsData)); }catch(e){} }
  function _wsKey(tipo,idx){ return tipo+'_'+(idx!=null?idx:''); }
  function wsSessoes(key){ return (worksessionsData[key]||{}).sessoes||[]; }
  function wsTotalSec(key){ return wsSessoes(key).reduce(function(s,r){ return s+(r.duracaoSec||0); },0); }
  function wsFmtDur(sec){
    if(!sec||sec<0) return '0min';
    var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);
    return h>0?h+'h '+m+'min':m+'min';
  }
  function wsFmtDurLong(sec){
    var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    return _wsPad(h)+'h '+_wsPad(m)+'min '+_wsPad(s)+'s';
  }
  function wsTotalSecMesAtual(){
    var now=new Date();
    var mesISO=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    var total=0;
    Object.values(worksessionsData).forEach(function(d){
      (d.sessoes||[]).forEach(function(s){ if(s.startedAt&&s.startedAt.slice(0,7)===mesISO) total+=(s.duracaoSec||0); });
    });
    return total;
  }
  function _wsFmtTopbar(sec){
    var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    return _wsPad(h)+':'+_wsPad(m)+':'+_wsPad(s);
  }
  var ICO_PAUSE='<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>';
  var ICO_PLAY='<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><polygon points="4,2 18,10 4,18"/></svg>';
  function _wsTick(){
    if(!_wsActive||_wsActive.paused) return;
    var lapSec=Math.round((Date.now()-_wsActive.startedAt)/1000);
    var total=wsTotalSec(_wsActive.key)+lapSec;
    var tt=document.getElementById('ws-topbar-time');
    if(tt) tt.textContent=_wsFmtTopbar(total);
    var pe=document.getElementById('ws-panel-elapsed');
    if(pe) pe.textContent=wsFmtDurLong(total);
  }
  function _wsUpdateFloat(){
    var logo=document.getElementById('ws-topbar-logo');
    var timer=document.getElementById('ws-topbar-timer');
    if(logo) logo.classList.toggle('u-hidden',!!_wsActive);
    if(timer) timer.classList.toggle('u-hidden',!_wsActive);
    if(_wsActive){
      var nm=document.getElementById('ws-topbar-nome');
      if(nm){ nm.textContent=_wsActive.nome; nm.title=_wsActive.nome; }
      var pp=document.getElementById('ws-topbar-pp');
      if(pp) pp.innerHTML=_wsActive.paused?ICO_PLAY:ICO_PAUSE;
      var tt=document.getElementById('ws-topbar-time');
      if(tt){
        if(_wsActive.paused){
          var tot=wsTotalSec(_wsActive.key);
          tt.textContent=_wsFmtTopbar(tot);
        } else {
          var lapSec=Math.round((Date.now()-_wsActive.startedAt)/1000);
          tt.textContent=_wsFmtTopbar(wsTotalSec(_wsActive.key)+lapSec);
        }
      }
    }
  }
  function _wsSalvarLap(){
    if(!_wsActive||_wsActive.paused) return;
    var duracaoSec=Math.max(0,Math.round((Date.now()-_wsActive.startedAt)/1000));
    if(duracaoSec>5){
      if(!worksessionsData[_wsActive.key]) worksessionsData[_wsActive.key]={sessoes:[]};
      worksessionsData[_wsActive.key].sessoes.unshift({
        id:'ws_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),
        startedAt:new Date(_wsActive.startedAt).toISOString(),
        endedAt:new Date().toISOString(),
        duracaoSec:duracaoSec
      });
      _wsSave();
    }
  }
  function _wsPausar(){
    if(!_wsActive||_wsActive.paused) return;
    clearInterval(_wsActive.tickId); _wsActive.tickId=null;
    _wsSalvarLap();
    _wsActive.paused=true;
    _wsUpdateFloat();
  }
  function _wsResumir(){
    if(!_wsActive||!_wsActive.paused) return;
    _wsActive.startedAt=Date.now(); _wsActive.paused=false;
    _wsActive.tickId=setInterval(_wsTick,1000);
    _wsTick(); _wsUpdateFloat();
  }
  function _wsTogglePausa(){
    if(!_wsActive) return;
    if(_wsActive.paused) _wsResumir(); else _wsPausar();
  }
  function _wsPararSilently(){
    if(!_wsActive) return;
    clearInterval(_wsActive.tickId);
    _wsSalvarLap();
    _wsActive=null;
    _wsUpdateFloat();
  }
  function _wsPararCompletamente(){ _wsPararSilently(); }
  function wsIniciar(tipo,idx,jobId,nome){
    if(_wsActive) _wsPararSilently();
    var key=_wsKey(tipo,idx);
    _wsActive={key:key,nome:nome,jobId:jobId||null,startedAt:Date.now(),tickId:null};
    _wsActive.tickId=setInterval(_wsTick,1000);
    _wsUpdateFloat();
    _wsTick();
  }
  function tcTempo(btn){
    var sl=btn.closest('.tsk-card');
    var tipo=sl.dataset.tipo, idx=sl.dataset.idx, jobId=sl.dataset.jobId||'', hora=sl.dataset.hora||'';
    var wsIdx=(tipo==='evento')?(jobId+'_'+hora):(idx||'');
    var nome=sl.querySelector('.tsk-title')?sl.querySelector('.tsk-title').textContent:tipo;
    abrirTempoTarefa(tipo,wsIdx,jobId,nome);
  }
  function wsAbrirPainelAtivo(){
    if(!_wsActive) return;
    var parts=_wsActive.key.indexOf('_')>-1?[_wsActive.key.slice(0,_wsActive.key.indexOf('_')),_wsActive.key.slice(_wsActive.key.indexOf('_')+1)]:['tarefa',''];
    abrirTempoTarefa(parts[0],parts[1],_wsActive.jobId||'',_wsActive.nome);
  }
  function wsIniciarEAtualizar(tipo,idx,jobId,nome){ wsIniciar(tipo,idx,jobId,nome); abrirTempoTarefa(tipo,idx,jobId,nome); }
  function wsPararEAtualizar(tipo,idx,jobId,nome){
    _wsPararSilently();
    if(typeof renderMonthTicker==='function') renderMonthTicker();
    abrirTempoTarefa(tipo,idx,jobId,nome);
  }
  function abrirTempoTarefa(tipo,idx,jobId,nome){
    var key=_wsKey(tipo,idx);
    var isAtivo=_wsActive&&_wsActive.key===key;
    var sessoes=wsSessoes(key);
    var totalSec=wsTotalSec(key);
    var activeSec=isAtivo?Math.round((Date.now()-_wsActive.startedAt)/1000):0;
    var totalComAtivo=totalSec+activeSec;
    var eTipo=escapeHtml(tipo),eIdx=escapeHtml(idx||''),eJobId=escapeHtml(jobId||'');
    var eNome=escapeHtml(nome).replace(/'/g,'&#39;').replace(/"/g,'&quot;');
    var timerHtml=isAtivo
      ?'<div class="ws-panel-active"><div id="ws-panel-elapsed" class="ws-panel-elapsed">'+wsFmtDurLong(totalComAtivo)+'</div>'+
        '<button class="btn primary ws-btn-parar" onclick="wsPararEAtualizar(\''+eTipo+'\',\''+eIdx+'\',\''+eJobId+'\',\''+eNome+'\')">PARAR</button></div>'
      :'<div style="padding-bottom:4px"><button class="btn primary ws-btn-iniciar" onclick="wsIniciarEAtualizar(\''+eTipo+'\',\''+eIdx+'\',\''+eJobId+'\',\''+eNome+'\')">INICIAR SESSÃO</button></div>';
    var totalHtml='<div class="ws-total-row"><span class="ws-total-lbl">TEMPO TOTAL</span><span class="ws-total-val">'+(totalComAtivo>0?wsFmtDur(totalComAtivo):'—')+'</span></div>';
    var MABB=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    var sessoesHtml=sessoes.length===0
      ?'<p style="color:var(--ink-faint);font-size:13px;text-align:center;padding:24px 0 8px">Nenhuma sessão registrada</p>'
      :sessoes.map(function(s,i){
          var start=new Date(s.startedAt),end=new Date(s.endedAt);
          var dateFmt=start.getDate()+' '+MABB[start.getMonth()]+' '+start.getFullYear();
          var timeFmt=_wsPad(start.getHours())+':'+_wsPad(start.getMinutes())+' — '+_wsPad(end.getHours())+':'+_wsPad(end.getMinutes());
          return '<div class="ws-sessao-row">'+
            '<div class="ws-sessao-info">'+
              '<div class="ws-sessao-date">'+dateFmt+'</div>'+
              '<div class="ws-sessao-time">'+timeFmt+'</div>'+
              '<div class="ws-sessao-dur">'+wsFmtDur(s.duracaoSec)+'</div>'+
            '</div>'+
            '<div class="ws-sessao-acts">'+
              '<button class="ws-act-btn" onclick="wsEditarSessao(\''+escapeHtml(key)+'\','+i+',\''+eTipo+'\',\''+eIdx+'\',\''+eJobId+'\',\''+eNome+'\')">EDITAR</button>'+
              '<button class="ws-act-btn ws-act-del" onclick="wsExcluirSessao(\''+escapeHtml(key)+'\','+i+',\''+eTipo+'\',\''+eIdx+'\',\''+eJobId+'\',\''+eNome+'\')">EXCLUIR</button>'+
            '</div>'+
          '</div>';
        }).join('');
    openInfo(nome,timerHtml+totalHtml+'<div class="ws-sessoes-lbl">SESSÕES</div><div class="ws-sessoes-list">'+sessoesHtml+'</div>');
  }
  function wsExcluirSessao(key,idx,tipo,taskIdx,jobId,nome){
    if(!(worksessionsData[key]&&worksessionsData[key].sessoes)) return;
    if(!confirm('Excluir esta sessão?')) return;
    worksessionsData[key].sessoes.splice(idx,1);
    _wsSave(); if(typeof renderMonthTicker==='function') renderMonthTicker();
    abrirTempoTarefa(tipo,taskIdx,jobId,nome);
  }
  function wsEditarSessao(key,sessIdx,tipo,taskIdx,jobId,nome){
    var s=worksessionsData[key]&&worksessionsData[key].sessoes[sessIdx];
    if(!s) return;
    var start=new Date(s.startedAt),end=new Date(s.endedAt);
    var eTipo=escapeHtml(tipo),eIdx=escapeHtml(taskIdx||''),eJobId=escapeHtml(jobId||'');
    var eNome=escapeHtml(nome).replace(/'/g,'&#39;').replace(/"/g,'&quot;');
    var eKey=escapeHtml(key);
    openInfo('Editar sessão',
      '<div class="field"><label>Data</label><input type="date" id="wse-date" value="'+start.toISOString().slice(0,10)+'"></div>'+
      '<div class="field-row">'+
        '<div class="field"><label>Início</label><input type="time" id="wse-start" value="'+_wsPad(start.getHours())+':'+_wsPad(start.getMinutes())+'"></div>'+
        '<div class="field"><label>Fim</label><input type="time" id="wse-end" value="'+_wsPad(end.getHours())+':'+_wsPad(end.getMinutes())+'"></div>'+
      '</div>'+
      '<button class="btn primary u-w-full u-mt-8" onclick="wsSalvarEdicao(\''+eKey+'\','+sessIdx+',\''+eTipo+'\',\''+eIdx+'\',\''+eJobId+'\',\''+eNome+'\')">SALVAR</button>',
      function(){ abrirTempoTarefa(tipo,taskIdx,jobId,nome); }
    );
  }
  function wsSalvarEdicao(key,sessIdx,tipo,taskIdx,jobId,nome){
    var sd=document.getElementById('wse-date').value;
    var st=document.getElementById('wse-start').value;
    var et=document.getElementById('wse-end').value;
    if(!sd||!st||!et){ showToast('Preencha todos os campos'); return; }
    var startedAt=new Date(sd+'T'+st+':00').toISOString();
    var endedAt=new Date(sd+'T'+et+':00').toISOString();
    var dur=Math.max(0,Math.round((new Date(endedAt)-new Date(startedAt))/1000));
    if(dur<=0){ showToast('O horário de fim deve ser após o início'); return; }
    if(!worksessionsData[key]) worksessionsData[key]={sessoes:[]};
    Object.assign(worksessionsData[key].sessoes[sessIdx],{startedAt,endedAt,duracaoSec:dur});
    _wsSave(); if(typeof renderMonthTicker==='function') renderMonthTicker();
    abrirTempoTarefa(tipo,taskIdx,jobId,nome);
  }
  /* ===== FIM WORK SESSIONS ===== */
