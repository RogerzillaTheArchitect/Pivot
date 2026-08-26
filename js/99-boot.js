/* Pivots — arranque
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

/* Todos os statements que EXECUTAM no load, na ordem original do
   ficheiro unico. Corre depois de todos os modulos para que qualquer
   funcao ou constante ja esteja definida quando for chamada. */

  sb.auth.onAuthStateChange((_event, session) => {
    /* TOKEN_REFRESHED (e outros eventos que não mudam quem está autenticado)
       disparam sozinhos, silenciosamente, a cada hora e sempre que a aba volta
       a ficar ativa — sem isto, cada um desses eventos recarregava TODOS os
       dados da conta (trabalhos, clientes, perfil, traduções…) e re-renderizava
       tudo, mesmo a meio de uma interação da pessoa. Isso causava sintomas
       espalhados: título de folhas abertas a voltar para o texto genérico,
       ecrãs a "misturar-se" a meio de um clique, listas a re-renderizar do
       nada. Só reagimos aos eventos que realmente significam início/fim de
       sessão. */
    const eventosRelevantes = ['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'PASSWORD_RECOVERY'];
    if (!eventosRelevantes.includes(_event)) return;
    if (_event === 'SIGNED_OUT' || !session) {
      authPronta = true;
      tentarEsconderSplash();
      return;
    }
    /* Link de "esqueci a password": a Supabase autentica a pessoa ao seguir o
       link (é assim que confirma que é dona do email) e dispara este evento
       em vez de SIGNED_IN — mostramos o ecrã de escolher nova password em vez
       de entrar direto na app com a sessão temporária de recuperação. */
    if (_event === 'PASSWORD_RECOVERY') {
      authPronta = true;
      const landing=document.getElementById('landing-page');
      if (landing) landing.style.display='none';
      const tela=document.getElementById('login-screen');
      if (tela) tela.classList.remove('hide');
      ['login-form-entrar','login-form-criar','login-form-reset'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
      const np=document.getElementById('login-form-newpass');
      if (np) np.style.display='block';
      tentarEsconderSplash();
      return;
    }
    if (aProcessarAuth) return;
    aProcessarAuth = true;
    // IMPORTANTE: o supabase-js@2 mantém um lock de autenticação enquanto este
    // callback corre. Qualquer chamada sb.* aqui dentro (ex.: sb.from(...) em
    // carregarWorkspace, que precisa da sessão) fica à espera do mesmo lock e
    // bloqueia para sempre — o login nunca resolve. Adiar com setTimeout(0)
    // corre o trabalho FORA do lock, depois do callback retornar.
    setTimeout(async () => {
      try {
        const ok = await carregarWorkspace(session);
        if (ok) {
          const tela=document.getElementById('login-screen');
          if (tela) tela.classList.add('hide');
          const landing=document.getElementById('landing-page');
          if (landing) landing.style.display='none';
          if (precisaCompletarConvite) {
            abrirCompletarConvite(session);
          }
        }
      } finally {
        aProcessarAuth = false;
        authPronta = true;
        tentarEsconderSplash();
      }
    }, 0);
  });
  (function checkPortalAccess(){
    const params = new URLSearchParams(window.location.search);
    const token = params.get('portal');
    if (token){ window.PIVOT_PORTAL_TOKEN = token; ppToken = token; }
    const ctoken = params.get('colab');
    if (ctoken){ colabToken = ctoken; }
    if (params.get('convite')==='1'){ precisaCompletarConvite = true; }
  })();
  (function validarStrings(){
    const problemas=[];
    for(const key in STRINGS){
      const entry=STRINGS[key];
      for(const l of I18N_LANGS){
        if(typeof entry[l]!=='string' || entry[l].trim()===''){
          problemas.push(key+'.'+l);
        }
      }
    }
    if(problemas.length){
      console.error('[i18n] '+problemas.length+' entradas incompletas em STRINGS:', problemas);
    }
  })();
  _wsLoad();
  LegalLibrary.init();
  document.addEventListener('click', e=>{
    const dd2=document.getElementById('tw-cliente-dropdown');
    if(dd2 && e.target.id!=='tw-cliente' && !e.target.closest('#tw-cliente-dropdown')) dd2.style.display='none';
  });
  document.addEventListener('click', e=>{
    const dd=document.getElementById('tw-addr-dropdown');
    if(!dd || dd.style.display==='none') return;
    if(!e.target.closest('#tw-local') && !e.target.closest('#tw-addr-dropdown')) dd.style.display='none';
  });
  document.addEventListener('click', function(e){
    if(!__activeOverlay) return;
    if(e.target.closest('button,a,input,select,textarea,label,[role="button"],[onclick]')) return;
    let panelEl=null;
    if(__activeOverlay==='sheet') panelEl=document.getElementById('sheet');
    else if(__activeOverlay==='info') panelEl=document.getElementById('infoSheet');
    else if(__activeOverlay==='drawer') panelEl=document.getElementById('menu-drawer');
    if(panelEl && !panelEl.contains(e.target)) _omForceClose(__activeOverlay);
  }, true);
  document.addEventListener('keydown', e=>{
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){
      e.preventDefault(); go('pesquisa');
      setTimeout(()=>document.getElementById('searchin').focus(),50);
    }
    if(e.key==='Escape'){
      if(document.getElementById('infoSheet').classList.contains('show')){ closeInfo(); }
      else if(document.getElementById('sheet').classList.contains('show')){
        if(panelStack.length>1 || (panelStack[panelStack.length-1]==='trabalho' && trabalhoMoment>1)) panelBack();
        else closeSheet();
      }
      closeClient();
    }
  });
  renderCalendar();
  (function enableDrag(){
    const list=document.getElementById('blocklist');
    let dragEl=null, startY=0;

    list.addEventListener('pointerdown', e=>{
      const handle=e.target.closest('[data-handle]');
      if(!handle) return;
      dragEl=handle.closest('.block');
      dragEl.classList.add('dragging');
      startY=e.clientY;
      try{ handle.setPointerCapture(e.pointerId); }catch(err){}
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
    function onMove(e){
      if(!dragEl) return;
      const dy=e.clientY-startY;
      dragEl.style.transform='translateY('+dy+'px)';
      const dragRect=dragEl.getBoundingClientRect();
      const dragCenter=dragRect.top+dragRect.height/2;
      const prev=dragEl.previousElementSibling;
      const next=dragEl.nextElementSibling;
      if(prev){
        const r=prev.getBoundingClientRect();
        if(dragCenter < r.top+r.height/2){
          list.insertBefore(dragEl, prev);
          startY=e.clientY; dragEl.style.transform='translateY(0px)';
          return;
        }
      }
      if(next){
        const r=next.getBoundingClientRect();
        if(dragCenter > r.top+r.height/2){
          list.insertBefore(dragEl, next.nextElementSibling);
          startY=e.clientY; dragEl.style.transform='translateY(0px)';
          return;
        }
      }
    }
    function onUp(){
      if(dragEl){ dragEl.classList.remove('dragging'); dragEl.style.transform=''; }
      dragEl=null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      persistBlockOrder();
    }
  })();
  window.addEventListener('resize', ajustarPaddingEcra);
  window.addEventListener('orientationchange', ajustarPaddingEcra);
  if(window.ResizeObserver){
    const ro=new ResizeObserver(()=>ajustarPaddingEcra());
    const tb=document.querySelector('.topbar-mobile'), nv=document.querySelector('.nav');
    if(tb) ro.observe(tb);
    if(nv) ro.observe(nv);
  }
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(ajustarPaddingEcra); }
  (function splash(){
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxDelay = reduced ? 150 : 3000;
    setTimeout(()=>{ authPronta=true; tentarEsconderSplash(); }, maxDelay);
  })();
  staggerCards('#v-hoje .card, #v-hoje .collapse');
  renderMonthTicker();
  renderDashCustomCards();
  ajustarPaddingEcra();
  iniciarPortalPublicoSeAplicavel();
  iniciarColabPublicoSeAplicavel();
