/* Pivots — agenda
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== FIM TASK STACK ===== */

  /* =====================================================
     AGENDA FAN CAROUSEL — v2
  ===================================================== */
  !function(){
    /* Radial fan — cards tangentially oriented on an arc, flat baseline (y=0) */
    /* ── 3D RADIAL CYLINDER CAROUSEL ────────────────
       Edge-touching geometry: adjacent card edges meet exactly.
       Formula: R = W / (2 × tan(STEP/2))
         W=192, STEP=40° → R = 192/(2·tan(20°)) ≈ 264px
       Stage is pulled back -R so the center card (rotateY(0)+translateZ(R))
       lands at world-Z=0 = natural perspective scale (no forced scaling).
       Cards are fully opaque (opacity:1). Depth hierarchy via brightness only.
       backface-visibility:hidden (CSS) prevents backs from showing at >90°.
    ──────────────────────────────────────────────── */
    /* R = (W/2*(1+cos(STEP)) + gap) / sin(STEP) = (96*1.766+6)/0.643 ≈ 273px (~6px gap) */
    /* Cartões passam de retrato (192×282, ≈9:16) para paisagem (300×200,
       3:2), ocupando quase toda a largura, com só uma fatia dos laterais
       visível — ver reorganização da Dashboard de Tarefas. STEP mantém-se
       em 40° de propósito (a lógica de drag/loop/swipe não muda, só a
       geometria); R foi recalculado pela mesma fórmula já documentada
       para o novo W, e a perspetiva escalou na mesma proporção R_novo/
       R_antigo para preservar a mesma intensidade de profundidade 3D. */
    var AGD_3D_STEP=40, AGD_3D_R=476.4;
    /* Todas as posições na mesma linha de base — o efeito "leque" com
       laterais mais baixas (herdado da era retrato) foi removido a pedido:
       os 3 cards (central e laterais) devem alinhar verticalmente. */
    function _agdYOff(aOff){ return -10; }
    function _agd3dPos(off){
      var theta=off*AGD_3D_STEP;
      var aOff=Math.abs(off);
      var bright=aOff===0?null:Math.max(0.55, 1-aOff*0.18);
      var opacity=aOff===0?'1':(Math.max(0.65, 1-aOff*0.17)).toFixed(2);
      return {
        tr:'rotateY('+theta+'deg) translateZ('+AGD_3D_R+'px) translateY('+_agdYOff(aOff).toFixed(1)+'px)',
        f:aOff===0?'none':'brightness('+bright.toFixed(2)+')',
        opacity:opacity,
        z:40-aOff*12
      };
    }
    var AGD_W_ACT=340, AGD_H_ACT=227;

    /* Minimal hourglass SVG icon (stroke, no emoji) */
      +'<line x1="0.5" y1="0.65" x2="9.5" y2="0.65"/>'
      +'<line x1="0.5" y1="12.35" x2="9.5" y2="12.35"/>'
      +'<path d="M1.5 1 L5 5.8 L8.5 1"/>'
      +'<path d="M1.5 12 L5 7.2 L8.5 12"/>'
      +'</svg>';

    var AGD_MESES=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    var AGD_DIAS=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
    var AGD_TIPO_LABEL={contrato:'CONTRATO',pagamento:'PGMT',evento:'EVENTO',entrega:'ENTREGA',lembrete:'LEMBRETE',lista:'LISTA',tarefa:'TAREFA'};

    var ICO_LINK='<svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 8.5a3 3 0 0 0 4.24 0l2-2A3 3 0 0 0 7.5 2.25l-1.1 1.1"/><path d="M8.5 5.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 0 0 4.25 4.25l1.1-1.1"/></svg>';
    var ICO_USER='<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/></svg>';
    var ICO_EDIT='<svg viewBox="0 0 11 11" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1.5L9.5 4 3.5 10H1V7.5L7 1.5z"/></svg>';
    var ICO_CAL='<svg viewBox="0 0 14 14" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2.5" width="12" height="10" rx="1.5"/><path d="M9.5 1v3M4.5 1v3M1 6h12"/></svg>';
    var ICO_CLK='<svg viewBox="0 0 14 14" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3l2.5 1.5"/></svg>';
    var ICO_ARCH='<svg viewBox="0 0 11 11" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="1" y="4" width="9" height="6" rx="1"/><path d="M1 2h9v2H1z" fill="currentColor" stroke="none"/><path d="M3.5 7h4" stroke-linecap="round"/></svg>';
    var ICO_DONE='<svg viewBox="0 0 11 11" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 5.5l3 3L9.5 2"/></svg>';
    var ICO_TEMPO='<svg viewBox="0 0 12 12" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6" cy="7" r="4.2"/><path d="M6 5v2l1.4 1"/><path d="M6 2.8V1.5M4.4 3l-.4-.7"/></svg>';

    function agdFmtChipTimer(diffSec){
      if(diffSec<=0) return '00:00';
      var h=Math.floor(diffSec/3600);
      var m=Math.floor((diffSec%3600)/60);
      var s=diffSec%60;
      if(h>99) return Math.ceil(diffSec/86400)+' d';
      if(h>0) return h+':'+pad(m)+':'+pad(s);
      return pad(m)+':'+pad(s);
    }

    var _items=[], _active=0, _day='', _lpTimer=null, _swipeX=null, _swipeY=null;
    var _fanEls={}, _fanDirty=true;
    var _agdRulerRAF=null, _agdRulerCanvas=null;
    var _agdRulerRange=null, _agdRulerRanges=[];
    var _rulerOffsetMin=0;
    var _agdReturnTimer=null, _agdReturnRaf=null;
    function _agdCancelReturn(){ clearTimeout(_agdReturnTimer); _agdReturnTimer=null; if(_agdReturnRaf){cancelAnimationFrame(_agdReturnRaf);_agdReturnRaf=null;} }
    function _agdScheduleReturn(){
      _agdCancelReturn();
      if(!_rulerOffsetMin) return;
      _agdReturnTimer=setTimeout(function(){
        var startOff=_rulerOffsetMin;
        var dur=Math.min(1200, Math.abs(startOff)*50);
        var t0=performance.now();
        function step(now){
          var p=Math.min(1,(now-t0)/dur);
          var ease=1-Math.pow(1-p,3); /* ease-out cubic */
          _rulerOffsetMin=Math.round(startOff*(1-ease));
          _agdRulerDraw();
          if(p<1){ _agdReturnRaf=requestAnimationFrame(step); }
          else{ _rulerOffsetMin=0; _agdRulerDraw(); _agdReturnRaf=null; }
        }
        _agdReturnRaf=requestAnimationFrame(step);
      },5000);
    }

    function pad(n){ return n<10?'0'+n:String(n); }

    /* ── FAIXA DE DIAS (scroll horizontal) ──────────
       Substituiu o seletor fixo de 3 colunas por uma faixa mais longa
       (-7 a +30 dias a partir de hoje, não de _day — a faixa não desloca
       o intervalo à medida que se navega, só o dia realçado muda). Cada
       chip chama agdSelectDay(iso), a mesma função pública já usada
       noutros pontos da app para saltar direto para um dia. */
    var AGD_STRIP_BACK=7, AGD_STRIP_FWD=30;
    /* d.toISOString() converte para UTC — à noite/madrugada, em fusos a
       leste de UTC, isso pode devolver o dia a seguir ao que d.getDate()
       mostra (o resto do calendário deste ficheiro já tinha esta mesma
       exposição; aqui evita-se de propósito, porque a faixa mostra e
       compara datas lado a lado, onde o desencontro fica visível). */
    function _agdIsoLocal(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
    function renderDays(){
      var wrap=document.getElementById('agd-days');
      if(!wrap) return;
      var hoje=new Date(); hoje.setHours(0,0,0,0);
      var html='';
      for(var i=-AGD_STRIP_BACK;i<=AGD_STRIP_FWD;i++){
        var d=new Date(hoje); d.setDate(hoje.getDate()+i);
        var iso=_agdIsoLocal(d);
        var hasItems=_items.some(function(it){return it.dataISO===iso;});
        var isActive=iso===_day;
        html+='<button class="agd-day-col'+(isActive?' agd-day-center':'')+(hasItems?' agd-has-items':'')+'"'
          +' onclick="agdSelectDay(\''+iso+'\')" data-iso="'+iso+'" type="button">'
          +'<span class="agd-day-wd">'+AGD_DIAS[d.getDay()]+'</span>'
          +'<span class="agd-day-num">'+d.getDate()+'</span>'
          +'<span class="agd-day-mon">'+AGD_MESES[d.getMonth()]+'</span>'
          +'</button>';
      }
      wrap.innerHTML=html;
      /* scrollIntoView logo a seguir ao innerHTML às vezes corre antes do
         browser terminar o layout dos 38 botões novos (fica em scrollLeft
         0, sem erro nenhum — só não centra). Um requestAnimationFrame
         garante que o layout já assentou. */
      requestAnimationFrame(function(){
        var activeEl=wrap.querySelector('.agd-day-center');
        if(activeEl) activeEl.scrollIntoView({inline:'center', block:'nearest'});
      });
    }

    /* ── RULER TICKS — canvas rendering ─────────── */
    /* ── RULER v2 — scrolling minute timeline ─────────── */
    var AGD_R_PPM=8; /* pixels per minute — updated whenever _rulerStep changes */
    var _rulerStep=1; /* minutes between drawn ticks (1,5,10,15,30) */
    (function(){ var s=parseInt(localStorage.getItem('agd_ruler_step')||'0'); if([1,5,10,15,30].indexOf(s)!==-1){ _rulerStep=s; AGD_R_PPM=8/s; } })();

    function _agdRulerDraw(){
      var cv=_agdRulerCanvas;
      if(!cv||!cv.isConnected) return;
      var par=cv.parentElement;
      var W=par?par.offsetWidth:0;
      if(!W) return;
      var H=72;
      var dpr=Math.round(window.devicePixelRatio||1);
      if(cv.width!==W*dpr){ cv.width=W*dpr; cv.style.width=W+'px'; }
      if(cv.height!==H*dpr){ cv.height=H*dpr; cv.style.height=H+'px'; }
      var ctx=cv.getContext('2d');
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,W*dpr,H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);

      var now=new Date();
      var nowMinC=now.getHours()*60+now.getMinutes(); /* actual clock time for coloring */
      var totMin=nowMinC+(_rulerOffsetMin||0);
      var sub=0; /* snap on minute boundaries — no sub-minute scroll */
      var cx=W/2;

      /* Layout — labels above | ticks | indicator+label below */
      var TICK_TOP=24;
      var H_H=10, H_T=7;
      var W_H=2.5, W_T=1.5, W_O=0.75;
      var TRI_TIP_Y=TICK_TOP+H_H+5;  /* 39 — upward triangle below ticks */
      var TRI_H=5, TRI_W=9;

      var er=_agdRulerRange;
      var halfM=Math.ceil(cx/AGD_R_PPM)+2;

      /* ── 1. Small ticks (non-hour) ── */
      for(var i=-halfM;i<=halfM;i++){
        var aMin=totMin+i;
        var displayMin=((aMin%1440)+1440)%1440;
        var isHr=(displayMin%60===0);
        if(isHr) continue; /* hour ticks drawn after blocks */
        if(displayMin%_rulerStep!==0) continue;
        var x=cx+(i-sub)*AGD_R_PPM;
        if(x<-AGD_R_PPM*3||x>W+AGD_R_PPM*3) continue;
        var dFrac=Math.abs(x-cx)/cx;
        var op;
        if(dFrac<0.12) op=1;
        else{ var t2=(dFrac-0.12)/0.88; op=Math.max(0,1-t2*t2*(3-2*t2)); }
        if(op<0.01) continue;
        var isTn=(displayMin%10===0);
        var tW=isTn?W_T:W_O;
        ctx.save();
        ctx.strokeStyle='rgba(70,70,70,'+op.toFixed(3)+')';
        ctx.lineWidth=tW;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(x, TICK_TOP);
        ctx.lineTo(x, TICK_TOP+H_T);
        ctx.stroke();
        ctx.restore();
      }

      /* ── 2. Task range blocks (cover small ticks, drawn before hour ticks) ── */
      _agdRulerRanges.forEach(function(rng){
        var x0=cx+(rng.startMin-totMin-sub)*AGD_R_PPM;
        var x1=cx+(rng.endMin-totMin-sub)*AGD_R_PPM;
        var vx0=Math.max(0,x0), vx1=Math.min(W,x1);
        if(vx0>=vx1) return;
        var r,g,b;
        r=79;g=200;b=110;
        ctx.save();
        ctx.fillStyle='rgba('+r+','+g+','+b+',0.72)';
        ctx.fillRect(vx0, TICK_TOP, vx1-vx0, H_T);
        ctx.restore();
      });

      /* ── 3. Hour ticks (on top of blocks) + hour labels ── */
      for(var i=-halfM;i<=halfM;i++){
        var aMin=totMin+i;
        var displayMin=((aMin%1440)+1440)%1440;
        if(displayMin%60!==0) continue;
        var x=cx+(i-sub)*AGD_R_PPM;
        if(x<-AGD_R_PPM*3||x>W+AGD_R_PPM*3) continue;
        var dFrac=Math.abs(x-cx)/cx;
        var op;
        if(dFrac<0.12) op=1;
        else{ var t2=(dFrac-0.12)/0.88; op=Math.max(0,1-t2*t2*(3-2*t2)); }
        if(op<0.01) continue;
        /* Color: use event range if active card overlaps this minute */
        var inEv=er&&aMin>=er.startMin&&aMin<er.endMin;
        var r,g,b;
        if(inEv){r=79;g=200;b=110;} else{r=255;g=255;b=255;}
        ctx.save();
        ctx.strokeStyle='rgba('+r+','+g+','+b+','+op.toFixed(3)+')';
        ctx.lineWidth=W_H;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(x, TICK_TOP);
        ctx.lineTo(x, TICK_TOP+H_H);
        ctx.stroke();
        if(op>0.15){
          var hh=Math.floor(displayMin/60);
          ctx.font='bold 8.5px Inter Tight,sans-serif';
          ctx.textAlign='center';
          ctx.textBaseline='bottom';
          ctx.fillStyle='rgba('+r+','+g+','+b+','+(op*0.72).toFixed(3)+')';
          ctx.fillText(String(hh), x, TICK_TOP-3);
        }
        ctx.restore();
      }

      /* ── 4. Upward triangle (▲) below ticks ── */
      ctx.beginPath();
      ctx.moveTo(cx, TRI_TIP_Y);
      ctx.lineTo(cx-TRI_W/2, TRI_TIP_Y+TRI_H);
      ctx.lineTo(cx+TRI_W/2, TRI_TIP_Y+TRI_H);
      ctx.closePath();
      ctx.fillStyle='rgba(255,255,255,0.82)';
      ctx.fill();

      /* ── 4. Current time label below triangle ── */
      var displayCtrMin=((totMin%1440)+1440)%1440;
      ctx.font='bold 9px Inter Tight,sans-serif';
      ctx.textAlign='center';
      ctx.textBaseline='top';
      ctx.fillStyle='rgba(255,255,255,0.92)';
      ctx.fillText(pad(Math.floor(displayCtrMin/60))+':'+pad(displayCtrMin%60), cx, TRI_TIP_Y+TRI_H+4);
    }

    function _agdUpdateChipTimer(){
      var chip=document.querySelector('#agd-chip-timer-wrap .agd-chip-timer');
      if(!chip) return;
      var er=_agdRulerRange;
      var now=new Date();
      var nowMin=now.getHours()*60+now.getMinutes();
      var nowSec=now.getHours()*3600+now.getMinutes()*60+now.getSeconds();
      var todayISO=now.toISOString().slice(0,10);
      var txt='', cls='agd-chip-timer';

      if(er&&er.isActive&&nowMin<er.endMin){
        var remSec=er.endMin*60-nowSec;
        txt=agdFmtChipTimer(Math.max(0,remSec));
        cls='agd-chip-timer agd-chip-timer--active';
      } else {
        var nextSec=Infinity;
        for(var i=0;i<_items.length;i++){
          var it=_items[i];
          if(!it.hora||!it.dataISO) continue;
          var sp=it.hora.split(':');
          var sM=+sp[0]*60+(+sp[1]||0);
          var diff;
          if(it.dataISO===todayISO&&sM>nowMin){
            diff=sM*60-nowSec;
          } else if(it.dataISO>todayISO){
            var futureDays=Math.round((new Date(it.dataISO+'T00:00:00')-new Date(todayISO+'T00:00:00'))/86400000);
            diff=futureDays*86400+sM*60-nowSec;
          } else { continue; }
          if(diff>0&&diff<nextSec) nextSec=diff;
        }
        if(nextSec<Infinity){
          txt=agdFmtChipTimer(nextSec);
          cls='agd-chip-timer agd-chip-timer--upcoming';
        }
      }

      if(!txt){ chip.style.display='none'; return; }
      chip.textContent=txt;
      chip.className=cls;
      chip.style.display='';
    }

    var _agdLastRulerMin=-1, _agdLastRulerSec=-1;
    function _agdRulerLoop(){
      if(!_agdRulerCanvas||!_agdRulerCanvas.isConnected){ _agdRulerRAF=null; return; }
      _agdRulerRAF=requestAnimationFrame(function(){
        var now=new Date();
        var curMin=now.getHours()*60+now.getMinutes();
        var curSec=curMin*60+now.getSeconds();
        if(curMin!==_agdLastRulerMin){
          _agdLastRulerMin=curMin;
          _agdRulerDraw();
        }
        if(curSec!==_agdLastRulerSec){
          _agdLastRulerSec=curSec;
          _agdUpdateChipTimer();
          _agdUpdateCardFootTimers();
        }
        _agdRulerLoop();
      });
    }

    function renderRuler(){
      var viz=document.getElementById('agd-ruler-viz');
      var cd=document.getElementById('agd-ruler-cd');
      if(!viz) return;

      var ctr=_items[_active];
      var now=new Date();
      var todayISO=now.toISOString().slice(0,10);
      var nowMin=now.getHours()*60+now.getMinutes();

      /* Event range for active card glow — only when horaFim is explicit */
      _agdRulerRange=null;
      if(ctr&&ctr.hora&&ctr.horaFim){
        var sp=ctr.hora.split(':');
        var sM=+sp[0]*60+(+sp[1]||0);
        var ep=ctr.horaFim.split(':');
        var eM=+ep[0]*60+(+ep[1]||0);
        var isToday=!ctr.dataISO||(ctr.dataISO===todayISO);
        if(isToday) _agdRulerRange={startMin:sM,endMin:eM,isActive:nowMin>=sM&&nowMin<eM,isPast:nowMin>=eM};
      }

      /* All event ranges for glow lines */
      _agdRulerRanges=[];
      _items.forEach(function(it){
        if(!it.hora||!it.dataISO||it.dataISO!==todayISO) return;
        var s=it.hora.split(':');
        var sM=+s[0]*60+(+s[1]||0);
        var eM;
        if(it.horaFim){ var e=it.horaFim.split(':'); eM=+e[0]*60+(+e[1]||0); }
        else { eM=sM+30; } /* default 30-min block when no end time */
        _agdRulerRanges.push({startMin:sM,endMin:eM,isActive:nowMin>=sM&&nowMin<eM,isPast:nowMin>=eM});
      });

      /* Ensure canvas is in DOM */
      if(!_agdRulerCanvas||!_agdRulerCanvas.isConnected){
        viz.innerHTML='';
        _agdRulerCanvas=document.createElement('canvas');
        _agdRulerCanvas.className='agd-ruler-canvas';
        viz.appendChild(_agdRulerCanvas);
      }

      /* Start animation loop if not running */
      if(!_agdRulerRAF) _agdRulerLoop();

      /* Force immediate redraw (event ranges may have changed) */
      _agdLastRulerMin=-1;
      _agdRulerDraw();

      /* Force chip timer refresh on next RAF tick */
      _agdLastRulerSec=-1;

      bindRulerSwipe();
      agdInitIntervalSel();
    }

    /* ── FAN (persistent elements — CSS transition animates position changes) ── */
    function renderFan(){
      var fan=document.getElementById('agd-fan');
      if(!fan) return;

      if(!_items.length){
        Object.keys(_fanEls).forEach(function(k){
          try{fan.removeChild(_fanEls[k]);}catch(e){}
        });
        _fanEls={}; _fanDirty=false;
        fan.innerHTML='<div class="agd-empty"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 6L9 17l-5-5"/></svg>'
          +'<div class="agd-empty-text">Sem compromissos</div></div>';
        return;
      }

      /* Empty state for selected day (other days have items) */
      var dayHasItems=_items.some(function(it){return it.dataISO===_day;});
      if(!dayHasItems){
        Object.keys(_fanEls).forEach(function(k){try{fan.removeChild(_fanEls[k]);}catch(e){}});
        _fanEls={}; _fanDirty=true;
        fan.innerHTML='';
        /* Anchor to fan-wrap (position:relative;height:300px) so centering works */
        var wr=document.getElementById('agd-fan-wrap');
        if(wr&&!wr.querySelector('.agd-empty-day')){
          var ed=document.createElement('div');
          ed.className='agd-empty-day';
          ed.textContent='Não há tarefas registradas';
          wr.appendChild(ed);
        }
        return;
      }
      /* Remove empty-day label when day has items */
      var wr2=document.getElementById('agd-fan-wrap');
      if(wr2){var ed2=wr2.querySelector('.agd-empty-day');if(ed2) wr2.removeChild(ed2);}
      var emptyEl=fan.querySelector('.agd-empty');
      if(emptyEl) fan.removeChild(emptyEl);

      /* Full rebuild when items list changed (archive/conclude/initial) */
      if(_fanDirty){
        var emptyEl=fan.querySelector('.agd-empty');
        if(emptyEl) fan.removeChild(emptyEl);
        Object.keys(_fanEls).forEach(function(k){
          try{fan.removeChild(_fanEls[k]);}catch(e){}
        });
        _fanEls={}; _fanDirty=false;
      }

      /* Compute which items need a positioner element */
      var needed={};
      for(var off=-2;off<=2;off++){
        var idx=_active+off;
        if(idx>=0&&idx<_items.length) needed[idx]=off;
      }

      /* Remove positioners that scrolled out of range */
      Object.keys(_fanEls).forEach(function(k){
        if(!(+k in needed)){
          try{fan.removeChild(_fanEls[k]);}catch(e){}
          delete _fanEls[+k];
        }
      });

      /* Create or update (animate) each visible positioner
         Sort: farthest first so center card paints on top */
      Object.keys(needed).sort(function(a,b){
        return Math.abs(needed[+b])-Math.abs(needed[+a]);
      }).forEach(function(k){
        var idx=+k, off=needed[idx], isAct=(off===0);
        var pos=_agd3dPos(off);

        var el=_fanEls[idx];
        if(el){
          /* Update transform → CSS transition animates the change */
          el.style.transform=pos.tr;
          el.style.filter=pos.f;
          el.style.opacity=pos.opacity;
          el.style.zIndex=pos.z;
          var card=el.querySelector('.agd-card');
          if(card) card.classList.toggle('agd-active',isAct);
        } else {
          el=document.createElement('div');
          el.className='agd-card-positioner';
          el.dataset.idx=idx;
          el.style.cssText='width:'+AGD_W_ACT+'px;height:'+AGD_H_ACT+'px;'
            +'transform:'+pos.tr+';z-index:'+pos.z+';opacity:'+pos.opacity+';'
            +(pos.f&&pos.f!=='none'?'filter:'+pos.f+';':'');
          el.innerHTML=buildCard(_items[idx],idx,isAct);
          el.addEventListener('click',(function(i){
            return function(e){
              if(e.target.closest('.agd-act-btn')) return;
              if(i!==_active){ agdSetActive(i); return; }
              /* Active card tap: close overlay if open, else open details */
              var overlay=el.querySelector('.agd-card-actions.agd-vis');
              if(overlay){ overlay.classList.remove('agd-vis'); return; }
              agdVerDetalhes(i);
            };
          })(idx));
          fan.appendChild(el);
          _fanEls[idx]=el;
        }
      });

      bindLongPress();
      bindFanSwipe();
    }

    /* ── PHOTO HTML ───────────────────────────────── */
    var AGD_PH_INK='/assets/agd-ph-ink.png';
    var AGD_PH_PAPER='/assets/agd-ph-paper.png';
    var AGD_PH_SOLTO='/assets/agd-ph-solto.png';
    var AGD_PH_SOLTO_INK='/assets/agd-ph-solto-ink.png';

    function agdPhotoHtml(nome,cliente,foto,ink){
      var src=foto||(ink?AGD_PH_INK:AGD_PH_PAPER);
      return '<div class="agd-photo-fill" style="background-image:url('+src+')"></div>';
    }

    /* ── CARD FOOTER — timer / status chip ──────── */
    function _agdFootHtml(it){
      var now=new Date();
      var todayISO=now.toISOString().slice(0,10);
      var nowSec=now.getHours()*3600+now.getMinutes()*60+now.getSeconds();
      if(it.hora&&it.dataISO){
        var sp=it.hora.split(':');
        var sSec=+sp[0]*3600+(+sp[1]||0)*60;
        var eSec=it.horaFim?(function(){var p=it.horaFim.split(':');return +p[0]*3600+(+p[1]||0)*60;}()):sSec+3600;
        if(it.dataISO===todayISO){
          if(nowSec<sSec) return '<span class="agd-ft-lbl agd-ft-upcoming">Inicia em '+agdFmtChipTimer(sSec-nowSec)+'</span>';
          if(nowSec<eSec) return '<span class="agd-ft-lbl agd-ft-active">Finaliza em '+agdFmtChipTimer(eSec-nowSec)+'</span>';
          return '<span class="agd-ft-chip agd-ft-late">ATRASADO</span>';
        }
        if(it.dataISO>todayISO){
          var fd=Math.round((new Date(it.dataISO+'T00:00:00')-new Date(todayISO+'T00:00:00'))/86400000);
          return '<span class="agd-ft-lbl agd-ft-upcoming">Inicia em '+agdFmtChipTimer(Math.max(0,fd*86400+sSec-nowSec))+'</span>';
        }
        return '<span class="agd-ft-chip agd-ft-late">ATRASADO</span>';
      }
      if(it.dataISO){
        if(it.dataISO<todayISO) return '<span class="agd-ft-chip agd-ft-late">ATRASADO</span>';
        if(it.dataISO===todayISO) return '<span class="agd-ft-chip agd-ft-today">HOJE</span>';
      }
      return '';
    }

    /* Atualiza o timer em cada card visível (chamado pelo loop do ruler, 1×/s) */
    function _agdUpdateCardFootTimers(){
      var now=new Date();
      var todayISO=now.toISOString().slice(0,10);
      var nowSec=now.getHours()*3600+now.getMinutes()*60+now.getSeconds();
      var fan=document.getElementById('agd-fan');
      if(!fan) return;
      fan.querySelectorAll('.agd-card').forEach(function(card){
        var foot=card.querySelector('.agd-card-foot');
        if(!foot) return;
        var hora=card.dataset.hora, horafim=card.dataset.horafim, dataiso=card.dataset.dataiso;
        if(!hora||!dataiso) return; /* no-hora cards: chip is static */
        var sp=hora.split(':');
        var sSec=+sp[0]*3600+(+sp[1]||0)*60;
        var eSec=horafim?(function(){var p=horafim.split(':');return +p[0]*3600+(+p[1]||0)*60;}()):sSec+3600;
        var html;
        if(dataiso===todayISO){
          if(nowSec<sSec) html='<span class="agd-ft-lbl agd-ft-upcoming">Inicia em '+agdFmtChipTimer(sSec-nowSec)+'</span>';
          else if(nowSec<eSec) html='<span class="agd-ft-lbl agd-ft-active">Finaliza em '+agdFmtChipTimer(eSec-nowSec)+'</span>';
          else html='<span class="agd-ft-chip agd-ft-late">ATRASADO</span>';
        } else if(dataiso>todayISO){
          var fd=Math.round((new Date(dataiso+'T00:00:00')-new Date(todayISO+'T00:00:00'))/86400000);
          html='<span class="agd-ft-lbl agd-ft-upcoming">Inicia em '+agdFmtChipTimer(Math.max(0,fd*86400+sSec-nowSec))+'</span>';
        } else { html='<span class="agd-ft-chip agd-ft-late">ATRASADO</span>'; }
        foot.innerHTML=html;
      });
    }

    /* ── BUILD CARD ───────────────────────────────── */
    function buildCard(it,idx,isAct){
      var ink=(idx%2===0);
      var theme=ink?'agd-ink':'agd-paper';
      var actCls=isAct?' agd-active':'';
      var foto=clienteFotoPorNome(it.cliente);
      if(!foto && !it.cliente && !it.jobId) foto=ink?AGD_PH_SOLTO_INK:AGD_PH_SOLTO;
      var photoHtml=agdPhotoHtml(it.nome,it.cliente,foto,ink);
      var tipoLbl=AGD_TIPO_LABEL[it.tipo]||it.tipo.toUpperCase();

      /* Project name */
      var projNome='';
      if(it.jobId&&jobsData&&jobsData[it.jobId])
        projNome=jobsData[it.jobId].nome||jobsData[it.jobId].client||'';

      /* People chips */
      var pessoasIds=[];
      if(it.tipo==='tarefa'&&it.idx) pessoasIds=(tarefasData[it.idx]&&tarefasData[it.idx].pessoas)||[];
      else if(it.tipo==='lista'&&it.idx) pessoasIds=(listasData[it.idx]&&listasData[it.idx].pessoas)||[];
      else if(it.jobId&&jobsData[it.jobId]) pessoasIds=jobsData[it.jobId].pessoas||[];
      var peopleHtml='';
      if(pessoasIds.length){
        var MAX=3, extra=pessoasIds.length-MAX;
        pessoasIds.slice(0,MAX).forEach(function(id){
          var nm=id.indexOf('@')>-1?id.split('@')[0]:(typeof nomeMembro==='function'?nomeMembro(id):id);
          var inits=typeof avatarInitials==='function'?avatarInitials(nm):nm.slice(0,2).toUpperCase();
          peopleHtml+='<div class="agd-av" title="'+escapeHtml(nm)+'">'+inits+'</div>';
        });
        if(extra>0) peopleHtml+='<div class="agd-av agd-av-more">+'+extra+'</div>';
        peopleHtml='<div class="agd-people">'+peopleHtml+'</div>';
      }

      /* Date + time row */
      var dateTxt='';
      if(it.dataISO){
        var pts=it.dataISO.split('-');
        dateTxt=parseInt(pts[2],10)+' '+AGD_MESES[parseInt(pts[1],10)-1];
      }
      var dateRowHtml=it.hora
        ?'<div class="agd-card-datetime">'
          +'<span class="agd-card-date">'+ICO_CAL+dateTxt+'</span>'
          +'<span class="agd-card-hour">'+ICO_CLK+escapeHtml(it.hora)+'</span>'
          +'</div>'
        :'<div class="agd-card-datetime agd-card-datetime--notime">'
          +'<span class="agd-card-date">'+ICO_CAL+dateTxt+'</span>'
          +'</div>';

      return '<article class="agd-card '+theme+actCls+'"'
        +' data-hora="'+(it.hora||'')+'"'
        +' data-horafim="'+(it.horaFim||'')+'"'
        +' data-dataiso="'+(it.dataISO||'')+'">'
        +'<div class="agd-card-photo">'+photoHtml+'</div>'
        +'<div class="agd-card-body">'
          +'<div class="agd-card-body-spacer"></div>'
          +'<span class="agd-card-tipo">'+tipoLbl+'</span>'
          +'<h3 class="agd-card-title">'+escapeHtml(it.nome)+'</h3>'
          +(projNome
            ?'<div class="agd-card-proj">'+ICO_LINK
              +'<span class="agd-card-proj-name">'+escapeHtml(projNome)+'</span></div>'
            :'')
          +(it.cliente
            ?'<div class="agd-card-client">'+ICO_USER
              +'<span class="agd-card-client-name">'+escapeHtml(it.cliente)+'</span></div>'
            :'')
          +dateRowHtml
          +peopleHtml
        +'</div>'
        +'<div class="agd-card-foot">'+_agdFootHtml(it)+'</div>'
        +'<div class="agd-card-actions" id="agd-actions-'+idx+'">'
          +'<button class="agd-act-btn agd-act-editar" onclick="agdEditar('+idx+')">'+ICO_EDIT+' EDITAR</button>'
          +'<button class="agd-act-btn agd-act-tempo" onclick="agdTempo('+idx+')">'+ICO_TEMPO+' TEMPO</button>'
          +'<button class="agd-act-btn agd-act-arquivar" onclick="agdArquivar('+idx+')">'+ICO_ARCH+' ARQUIVAR</button>'
          +'<button class="agd-act-btn agd-act-concluir" onclick="agdConcluir('+idx+')">'+ICO_DONE+' CONCLUIR</button>'
        +'</div>'
        +'</article>';
    }

    /* ── LONG PRESS on active card ───────────────── */
    function bindLongPress(){
      var fan=document.getElementById('agd-fan');
      if(!fan) return;
      var card=fan.querySelector('.agd-card.agd-active');
      if(!card) return;
      function showAct(v){
        var a=card.querySelector('.agd-card-actions');
        if(a) a.classList.toggle('agd-vis',v);
      }
      card.addEventListener('pointerdown',function(){ clearTimeout(_lpTimer); _lpTimer=setTimeout(function(){showAct(true);},620); });
      function cancel(){ clearTimeout(_lpTimer); }
      card.addEventListener('pointerup',cancel);
      card.addEventListener('pointercancel',cancel);
      card.addEventListener('pointermove',cancel);
      card.addEventListener('click',function(e){
        var a=card.querySelector('.agd-card-actions.agd-vis');
        if(a&&!e.target.closest('.agd-act-btn')) showAct(false);
      });
    }

    /* ── FAN SWIPE (left/right) ──────────────────── */
    function bindFanSwipe(){
      var wrap=document.getElementById('agd-fan-wrap');
      if(!wrap||wrap._agdSwipeBound) return;
      wrap._agdSwipeBound=true;
      var sx=null, sy=null;

      function _dayHasItems(){ return _items.some(function(it){return it.dataISO===_day;}); }

      /* Snap positioners back to their resting transforms (called after drag cancel/no-op) */
      function _snapBack(){
        Object.keys(_fanEls).forEach(function(k){
          var idx=+k, off=idx-_active, pos=_agd3dPos(off), el=_fanEls[idx];
          if(!el) return;
          el.style.transform=pos.tr; el.style.filter=pos.f; el.style.opacity=pos.opacity;
        });
      }

      wrap.addEventListener('pointerdown',function(e){
        if(!_dayHasItems()) return;
        sx=e.clientX; sy=e.clientY;
        wrap.classList.add('agd-dragging'); /* disable CSS transition for real-time drag */
      });

      wrap.addEventListener('pointermove',function(e){
        if(sx===null) return;
        var dx=e.clientX-sx;
        if(Math.abs(dx)>8) e.preventDefault();
        /* Live drag: cards rotate continuously with finger movement */
        var prog=Math.max(-1,Math.min(1,-dx/110)); /* 110px = 1 card unit */
        Object.keys(_fanEls).forEach(function(k){
          var idx=+k, baseOff=idx-_active, effOff=baseOff-prog;
          var theta=effOff*AGD_3D_STEP;
          var aOff=Math.abs(effOff);
          var el=_fanEls[idx]; if(!el) return;
          el.style.transform='rotateY('+theta.toFixed(2)+'deg) translateZ('+AGD_3D_R+'px) translateY('+_agdYOff(aOff).toFixed(1)+'px)';
          el.style.filter=aOff<0.06?'none':'brightness('+(Math.max(0.55,1-aOff*0.18)).toFixed(2)+')';
          el.style.opacity=aOff<0.06?'1':(Math.max(0.65,1-aOff*0.17)).toFixed(2);
        });
      },{passive:false});

      wrap.addEventListener('pointerup',function(e){
        if(sx===null) return;
        var dx=e.clientX-sx, dy=e.clientY-sy;
        sx=null; sy=null;
        wrap.classList.remove('agd-dragging'); /* re-enable transition for snap animation */
        if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>44){
          if(!_dayHasItems()) return;
          if(dx<0&&_active<_items.length-1) agdSetActive(_active+1);
          else if(dx>0&&_active>0) agdSetActive(_active-1);
          else _snapBack(); /* at boundary — snap back */
        } else {
          _snapBack();
        }
      });

      wrap.addEventListener('pointercancel',function(){
        if(sx===null) return;
        sx=null; sy=null;
        wrap.classList.remove('agd-dragging');
        _snapBack();
      });
    }

    /* ── RULER SWIPE — drag to scroll hours; long-press to set interval ── */
    function bindRulerSwipe(){
      var outer=document.getElementById('agd-ruler-outer');
      if(!outer||outer._agdSwipeBound) return;
      outer._agdSwipeBound=true;
      var sx=null, startOffset=0, lpTimer=null, lpFired=false;
      function cancelLp(){ if(lpTimer){clearTimeout(lpTimer);lpTimer=null;} }
      outer.addEventListener('pointerdown',function(e){
        _agdCancelReturn();
        sx=e.clientX; startOffset=_rulerOffsetMin; lpFired=false;
        try{ outer.setPointerCapture(e.pointerId); }catch(ex){}
        lpTimer=setTimeout(function(){
          lpFired=true; sx=null; cancelLp();
          agdShowRulerIntervalSel();
        },500);
      });
      outer.addEventListener('pointermove',function(e){
        if(sx===null) return;
        var dx=e.clientX-sx;
        if(Math.abs(dx)>8) cancelLp();
        e.preventDefault();
        _rulerOffsetMin=startOffset-Math.round(dx/AGD_R_PPM);
        _agdRulerDraw();
      },{passive:false});
      outer.addEventListener('pointerup',function(){
        cancelLp();
        if(sx===null||lpFired){ sx=null; return; }
        sx=null;
        _agdScheduleReturn();
        /* Auto-focus card when ruler center lands on an event range */
        var now2=new Date();
        var cMin=now2.getHours()*60+now2.getMinutes()+_rulerOffsetMin;
        var dMin=((cMin%1440)+1440)%1440;
        for(var ii=0;ii<_items.length;ii++){
          var it2=_items[ii];
          if(!it2.hora||!it2.dataISO||it2.dataISO!==_day) continue;
          var sp2=it2.hora.split(':');
          var sM2=+sp2[0]*60+(+sp2[1]||0);
          var eM2=sM2+60;
          if(it2.horaFim){var ep2=it2.horaFim.split(':');eM2=+ep2[0]*60+(+ep2[1]||0);}
          if(dMin>=sM2&&dMin<eM2){ _active=ii; renderDays(); renderFan(); break; }
        }
      });
      outer.addEventListener('pointercancel',function(){ cancelLp(); sx=null; });
    }

    function agdShowRulerIntervalSel(){
      var el=document.getElementById('agd-isel');
      if(!el) return;
      /* Move to body so position:fixed isn't broken by ancestor transforms */
      if(el.parentNode!==document.body) document.body.appendChild(el);
      el.querySelectorAll('.agd-isel-opt').forEach(function(btn){
        btn.classList.toggle('agd-isel-opt--active',+btn.dataset.step===_rulerStep);
      });
      el.classList.remove('u-hidden');
    }

    function agdInitIntervalSel(){
      var el=document.getElementById('agd-isel');
      if(!el||el._agdBound) return;
      el._agdBound=true;
      el.querySelector('.agd-isel-bd').addEventListener('click',function(){
        el.classList.add('u-hidden');
      });
      el.querySelectorAll('.agd-isel-opt').forEach(function(btn){
        btn.addEventListener('click',function(){
          _rulerStep=+btn.dataset.step;
          AGD_R_PPM=8/_rulerStep;
          try{ localStorage.setItem('agd_ruler_step',_rulerStep); }catch(ex){}
          el.classList.add('u-hidden');
          _agdRulerDraw();
        });
      });
    }

    /* ── HELPERS ─────────────────────────────────── */
    function findCenter(items){
      if(!items.length) return 0;
      var now=new Date();
      var hojeISO=now.toISOString().slice(0,10);
      var nowMin=now.getHours()*60+now.getMinutes();
      /* 1. Prioridade: evento/tarefa em curso agora */
      for(var i=0;i<items.length;i++){
        var it=items[i];
        if(!it.dataISO||it.dataISO!==hojeISO||!it.hora) continue;
        var sp=it.hora.split(':'); var sM=+sp[0]*60+(+sp[1]||0);
        var eM=it.horaFim?(function(h){var p=h.split(':');return +p[0]*60+(+p[1]||0);})(it.horaFim):(sM+60);
        if(nowMin>=sM&&nowMin<eM) return i;
      }
      /* 2. Próximo compromisso TIMED (items com hora definida têm prioridade) */
      var hora=pad(now.getHours())+':'+pad(now.getMinutes());
      for(var i=0;i<items.length;i++){
        if(!items[i].dataISO||!items[i].hora) continue;
        if(items[i].dataISO>hojeISO) return i;
        if(items[i].dataISO===hojeISO&&items[i].hora>=hora) return i;
      }
      /* 3. Fallback: qualquer item hoje ou futuro (sem hora) */
      for(var i=0;i<items.length;i++){
        if(!items[i].dataISO) continue;
        if(items[i].dataISO>=hojeISO) return i;
      }
      return items.length-1;
    }

    /* ── PUBLIC API ──────────────────────────────── */
    window.renderAgenda=function(){
      if(!document.getElementById('agenda-section')) return;
      _items=gerarItensRadar();
      _active=findCenter(_items);
      _day=(_items[_active]&&_items[_active].dataISO)||new Date().toISOString().slice(0,10);
      _rulerOffsetMin=0; /* reset ruler scroll to current time */
      _fanDirty=true;
      renderDays(); renderRuler(); renderFan();
    };

    /* agdAnimSlide()/agdShiftDay() saíram — eram exclusivos do antigo
       seletor de 3 colunas (botões anterior/seguinte com animação de
       slide). A faixa de dias agora é scroll nativo + clique direto em
       agdSelectDay(); o próprio carrossel muda de dia via agdSetActive(),
       nunca chamou agdShiftDay(). */
    window.agdSelectDay=function(iso){
      _day=iso;
      var idx=_items.findIndex(function(it){return it.dataISO===iso;});
      if(idx>=0) _active=idx;
      renderDays(); renderRuler(); renderFan();
    };

    window.agdSetActive=function(idx){
      _active=Math.max(0,Math.min(idx,_items.length-1));
      _day=(_items[_active]&&_items[_active].dataISO)||_day;
      renderDays(); renderRuler(); renderFan();
    };

    window.agdVerDetalhes=function(idx){
      var it=_items[idx]; if(!it) return;
      if(it.jobId){ openJob(it.jobId); return; }
      /* Tarefa/lembrete/lista solta — painel de ações com blur */
      var html=
        '<div class="agd-act-panel">'+
          '<button class="agd-panel-btn" onclick="closeInfo();agdEditar('+idx+')">'+
            '<span class="agd-panel-ico">'+ICO_EDIT+'</span>'+
            '<span>Editar</span>'+
          '</button>'+
          '<button class="agd-panel-btn" onclick="closeInfo();agdTempo('+idx+')">'+
            '<span class="agd-panel-ico">'+ICO_TEMPO+'</span>'+
            '<span>Tempo</span>'+
          '</button>'+
          '<button class="agd-panel-btn" onclick="closeInfo();agdArquivar('+idx+')">'+
            '<span class="agd-panel-ico">'+ICO_ARCH+'</span>'+
            '<span>Arquivar</span>'+
          '</button>'+
          '<button class="agd-panel-btn agd-panel-btn--done" onclick="closeInfo();agdConcluir('+idx+')">'+
            '<span class="agd-panel-ico">'+ICO_DONE+'</span>'+
            '<span>Concluir</span>'+
          '</button>'+
        '</div>';
      openInfo(escapeHtml(it.nome), html);
    };

    window.agdEditar=function(idx){
      var it=_items[idx]; if(!it) return;
      abrirDetalheItemSolto(it.tipo, it.idx);
    };

    window.agdTempo=function(idx){
      var it=_items[idx]; if(!it) return;
      var fan=document.getElementById('agd-fan');
      if(fan){ var a=fan.querySelector('.agd-card-actions.agd-vis'); if(a) a.classList.remove('agd-vis'); }
      var taskIdx=(it.tipo==='evento')?((it.jobId||'')+'_'+(it.hora||'')):(it.idx!=null?it.idx:'');
      abrirTempoTarefa(it.tipo, taskIdx, it.jobId||'', it.nome);
    };

    window.agdArquivar=function(idx){
      var fan=document.getElementById('agd-fan');
      if(fan){ var a=fan.querySelector('.agd-card-actions.agd-vis'); if(a) a.classList.remove('agd-vis'); }
      _items.splice(idx,1);
      _fanDirty=true;
      if(_active>=_items.length) _active=Math.max(0,_items.length-1);
      renderDays(); renderRuler(); renderFan();
      if(typeof renderTasksList==='function') renderTasksList();
      if(typeof renderRadarDashboard==='function') renderRadarDashboard();
      showToast(t('toast.archivedFromRadar'));
    };

    window.agdConcluir=function(idx){
      var it=_items[idx]; if(!it) return;
      var tipo=it.tipo,itemIdx=it.idx,jobId=it.jobId;
      if(tipo==='lembrete'&&lembretesData[itemIdx]){ lembretesData[itemIdx].feito=true; saveLembretesData(); }
      else if(tipo==='lista'&&listasData[itemIdx]){ listasData[itemIdx].feito=true; saveListasData(); }
      else if(tipo==='tarefa'&&tarefasData[itemIdx]){ tarefasData[itemIdx].feito=true; saveTarefasData(); }
      else if(jobId){
        var job=jobsData[jobId]; if(!job) return;
        if(tipo==='pagamento') marcarPagoDynamic(jobId,parseInt(itemIdx,10));
        else if(tipo==='contrato'){ openJob(jobId); return; }
        else{
          var ms=(job.milestones||[]).find(function(m){return m.key==='principal';});
          if(ms){ ms.status='feito'; ms.feitoEm=new Date().toISOString(); pushHistory(job,t('toast.markedDone')); saveJobsData(); }
        }
      }
      _items.splice(idx,1);
      _fanDirty=true;
      if(_active>=_items.length) _active=Math.max(0,_items.length-1);
      renderDays(); renderRuler(); renderFan();
      if(typeof renderMonthTicker==='function') renderMonthTicker();
      if(typeof renderTasksList==='function') renderTasksList();
      if(typeof renderRadarDashboard==='function') renderRadarDashboard();
      showToast(t('toast.done'));
    };

  }();
  /* ===== FIM AGENDA FAN ===== */
