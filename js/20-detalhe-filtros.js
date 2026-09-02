/* Pivots — detalhe filtros
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== Detalhe — secções expansíveis com ações reais ===== */
  function toggleSec(el){ el.closest('.sec').classList.toggle('open'); }

  /* ===== Cliente portal — pagamento real ===== */

  /* ===== Trabalhos — filtros reais ===== */
  /* aplica um filtro de estado (key) a um card, lendo os datasets já calculados
     por updateJobCardInner. As chaves antigas (fechados/realizar/entregar/…)
     continuam a funcionar para a navegação vinda dos cards da dashboard, mesmo
     que já não apareçam como chips visíveis; as chaves "meucargo" e "cliente"
     reúnem, respetivamente, tudo o que está pendente do meu lado e do lado do
     cliente, para não haver dezenas de filtros micro. */
  function jobPassaChipDataset(j, key){
    switch(key){
      case 'todos': return true;
      case 'ativos': return j.dataset.state==='active';
      case 'meucargo': return j.dataset.fechado==='1' && (j.dataset.realizar==='1' || j.dataset.entregar==='1');
      case 'cliente': return j.dataset.fechado!=='1' || j.dataset.payment==='pending';
      case 'atrasados': return j.dataset.overdue==='1';
      case 'concluidos': return j.dataset.state==='done';
      case 'entregar': return j.dataset.entregar==='1' || j.dataset.state==='deliver';
      case 'assinatura': return j.dataset.signature==='pending';
      case 'pagamento': return j.dataset.payment==='pending';
      case 'fechados': return j.dataset.fechado==='1';
      case 'realizar': return j.dataset.realizar==='1';
      case 'executados': return j.dataset.executado==='1';
      case 'entregues': return j.dataset.entregue==='1';
      default: return true;
    }
  }
  /* um trabalho "cai" num dia do mês exibido se for a data do evento ou se tiver
     um pagamento por receber com vencimento nesse dia */
  function jobNoDia(job, year, month, day){
    const iso=year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    if(job.dateRaw===iso) return true;
    return (job.payments||[]).some(p=>p.dueDate===iso && p.status!=='pago');
  }
  /* filtro combinado: o chip de estado E (opcionalmente) o dia selecionado no
     calendário. Os dois conversam entre si — calendário filtra por dia, chips
     filtram por estado. */
  function aplicarFiltrosTrabalhos(){
    const m=calMonths[calIndex];
    const jobs=document.querySelectorAll('#v-trabalhos .job');
    let visible=0;
    jobs.forEach(j=>{
      let show=jobPassaChipDataset(j, calFiltroAtivo);
      if(show && calDiaAtivo!=null){
        const job=jobsData[j.dataset.jobId];
        show = job ? jobNoDia(job, m.year, m.month, calDiaAtivo) : false;
      }
      const w=j.closest('.job-card-wrap');
      if(w) w.style.display = show? 'block':'none'; else j.style.display = show? 'block':'none';
      if(show) visible++;
    });
    document.getElementById('jobsEmpty').style.display = visible===0 ? 'block':'none';
  }
  /* sem chip "Todos" — estado padrão (nenhum filtro ativo) mostra os projetos
     ativos normalmente. Tocar num chip já ativo desliga-o e volta a esse
     padrão, em vez de ficar sempre um filtro obrigatoriamente selecionado. */
  function filterJobs(el, key){
    const jaAtivo = !!(el && el.classList.contains('on'));
    document.querySelectorAll('#v-trabalhos .filter-row .chip').forEach(c=>c.classList.remove('on'));
    if(jaAtivo){
      calFiltroAtivo='todos';
    } else {
      if(el) el.classList.add('on');
      calFiltroAtivo=key;
    }
    /* "Todos" tem chip próprio agora — sempre que o estado efetivo for
       "todos" (seja por clicar nele diretamente ou por desativar outro
       filtro), ele fica visualmente marcado, nunca fica tudo apagado. */
    if(calFiltroAtivo==='todos'){
      const chipTodos=document.querySelector('#v-trabalhos .filter-row .chip[data-key="todos"]');
      if(chipTodos) chipTodos.classList.add('on');
    }
    if(calFiltroAtivo==='historico'){
      renderJobsArquivadosList();
    } else {
      const arqWrap=document.getElementById('jobsArquivadosList');
      if(arqWrap){ arqWrap.style.display='none'; arqWrap.innerHTML=''; }
      aplicarFiltrosTrabalhos();
    }
    if(typeof renderCalendar==='function') renderCalendar();
  }
  function abrirTrabalhosFiltrados(key){
    go('trabalhos');
    setTimeout(()=>{
      const chip=document.querySelector('#v-trabalhos .filter-row .chip[data-key="'+key+'"]');
      /* se a chave não tiver chip visível (ex.: fechados/executados/entregues,
         que agora só vivem na navegação da dashboard), aplica na mesma o filtro
         e limpa o destaque dos chips */
      filterJobs(chip, key);
    }, 60);
  }

  function selecionarClienteDaPesquisa(nome){
    openSheet(); pushPanel('trabalho'); trabalhoGoto(1);
    setTimeout(()=>{ const el=document.getElementById('tw-cliente'); if(el) el.value=nome; }, 80);
  }
  /* Histórico de pesquisas — últimas 10, mais recente primeiro, com botão
     de remoção individual. Persistido igual ao resto dos dados da conta. */
  let pesquisasRecentes=[];
  function savePesquisasRecentes(){ savePersisted('pivot-pesquisas-recentes', ()=>pesquisasRecentes); }
  async function loadPesquisasRecentes(){ await loadPersisted('pivot-pesquisas-recentes', d=>{ pesquisasRecentes=Array.isArray(d)?d:[]; }); }
  function registrarPesquisaRecente(q){
    q=(q||'').trim();
    if(!q) return;
    pesquisasRecentes=[q].concat(pesquisasRecentes.filter(p=>p.toLowerCase()!==q.toLowerCase())).slice(0,10);
    savePesquisasRecentes();
  }
  function removerPesquisaRecente(q){
    pesquisasRecentes=pesquisasRecentes.filter(p=>p!==q);
    savePesquisasRecentes();
    renderPesquisasRecentes();
  }
  function refazerPesquisaRecente(q){
    document.getElementById('searchin').value=q;
    fakeSearch();
  }
  function renderPesquisasRecentes(){
    const wrap=document.getElementById('search-recentes');
    if(!wrap) return;
    if(!pesquisasRecentes.length){ wrap.innerHTML=''; return; }
    wrap.innerHTML=pesquisasRecentes.map(q=>{
      const qEsc=escapeHtml(q).replace(/'/g,"\\'");
      return '<div class="search-recent-item" onclick="refazerPesquisaRecente(\''+qEsc+'\')">'+
        '<span class="search-recent-txt">'+escapeHtml(q)+'</span>'+
        '<span class="search-recent-x" onclick="event.stopPropagation();removerPesquisaRecente(\''+qEsc+'\')">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>'+
        '</span>'+
      '</div>';
    }).join('');
  }
  function fakeSearch(){
    const qRaw=document.getElementById('searchin').value.trim();
    const q=qRaw.toLowerCase();
    const res=document.getElementById('searchres');
    const box=document.getElementById('searchhits');
    const recentes=document.getElementById('search-recentes');
    if(!q){
      res.style.display='none';
      box.innerHTML='';
      if(recentes) recentes.style.display='block';
      renderPesquisasRecentes();
      return;
    }
    if(recentes) recentes.style.display='none';
    res.style.display='block';
    const jobMatches=jobsVisiveis().filter(j=>
      (j.client+' '+j.typeLabel+' '+(j.local||'')+' '+(j.date||'')).toLowerCase().includes(q)
    ).map(j=>'<div class="job" onclick="openJob(\''+j.id+'\')"><div class="job-top"><div class="job-top-l">'+avatarHtml(j.client,30,clienteFotoPorNome(j.client))+
      '<div><div class="job-client">'+escapeHtml(j.client)+'</div><div class="job-type">'+escapeHtml(j.typeLabel)+' · '+escapeHtml(j.date||'data a definir')+'</div></div></div>'+
      '<div class="state '+(j.contract.status==='assinado'?'s-active':'s-wait')+'">'+t(j.contract.status==='assinado'?'jobs.status.active':'jobs.status.waiting')+'</div></div></div>');
    const clienteMatches=Object.values(clientesData).filter(c=>
      (c.nome+' '+(c.email||'')+' '+(c.empresa||'')).toLowerCase().includes(q)
    ).map(c=>'<div class="pick-row" onclick="selecionarClienteDaPesquisa(\''+escapeHtml(c.nome).replace(/'/g,"\\'")+'\')"><div style="display:flex;align-items:center;gap:10px">'+avatarHtml(c.nome,28)+'<div><div class="nm">'+escapeHtml(c.nome)+'</div><div class="sub">'+escapeHtml(c.empresa||c.email||'cliente')+'</div></div></div></div>');
    const total=jobMatches.length+clienteMatches.length;
    res.textContent = total? total+' resultado'+(total>1?'s':'') : 'Sem resultados para "'+qRaw+'"';
    box.innerHTML = jobMatches.join('') + clienteMatches.join('');
    /* só entra no histórico depois de uma pausa na digitação (debounce) —
       nunca a cada tecla, senão o histórico enchia de buscas parciais
       ("c", "ca", "cas"...) em vez da busca que a pessoa quis fazer. */
    clearTimeout(window.__buscaDebounce);
    window.__buscaDebounce=setTimeout(()=>registrarPesquisaRecente(qRaw), 900);
  }


  function buildCalMonths(){
    const y0=new Date().getFullYear();
    const months=[];
    for(let mm=1; mm<=12; mm++){
      months.push({ year:y0, month:mm, days:new Date(y0,mm,0).getDate() });
    }
    return months;
  }
  const calMonths=buildCalMonths();
  /* filtragem do calendário: espelha a classificação usada nos chips de Trabalhos,
     para que o calendário mostre sempre os mesmos trabalhos que a lista abaixo */
  function jobPassaFiltroCal(job, key){
    if(key==='todos') return true;
    const c=classificarTrabalho(job);
    const state = c.concluido?'done':(c.aEntregar?'deliver':(c.fechado?'active':'wait'));
    switch(key){
      case 'fechados': return c.fechado;
      case 'realizar': return c.aRealizar;
      case 'ativos': return state==='active';
      case 'entregar': return c.aEntregar;
      case 'meucargo': return c.fechado && (c.aRealizar || c.aEntregar);
      case 'cliente': return !c.fechado || c.pagamentoPendente;
      case 'assinatura': return !c.fechado;
      case 'pagamento': return c.pagamentoPendente;
      case 'atrasados': return c.atrasado;
      case 'concluidos': return c.concluido;
      case 'executados': return c.executado;
      case 'entregues': return c.entregue;
      default: return true;
    }
  }
  /* cor de cada tipo de compromisso — usada tanto na grelha (mês) como na semana */
  /* pontos do calendário são todos iguais (brancos, simples) — o dia guarda o
     tipo de compromisso só para o texto que aparece ao tocar, não para a cor */
  function corMarcadorCal(){
    return 'rgba(255,255,255,.85)';
  }
  /* os três tipos de compromisso que existem de facto nos dados: evento (data do
     trabalho), pagamento (parcela com vencimento) e contrato (assinatura pendente,
     mostrado na data do evento — mesma lógica usada nas Tarefas do dashboard) */
  function dynamicEventsForMonth(year, month){
    const markers={}, info={};
    jobsVisiveis().filter(j=>!j.arquivado && jobPassaFiltroCal(j, calFiltroAtivo)).forEach(j=>{
      if(j.dateRaw){
        const msEvento=(j.milestones||[]).find(x=>x.key==='principal');
        const [y,mo,da]=j.dateRaw.split('-').map(Number);
        if(y===year && mo===month){
          if(msEvento && msEvento.status!=='feito'){
            markers[da]=[...(markers[da]||[]),'evento'];
            const label=j.typeLabel+' · '+j.client+(j.local?(' · '+j.local):'');
            info[da]=info[da]? (info[da]+' · '+label) : label;
          }
          if(j.structure && j.structure.contrato && j.contract && j.contract.status!=='assinado'){
            markers[da]=[...(markers[da]||[]),'contrato'];
            const clabel=t('tasks.contractPending')+' · '+j.client;
            info[da]=info[da]? (info[da]+' · '+clabel) : clabel;
          }
        }
      }
      (j.payments||[]).forEach(p=>{
        if(!p.dueDate || p.status==='pago') return;
        const [py,pm,pd]=p.dueDate.split('-').map(Number);
        if(py===year && pm===month){
          markers[pd]=[...(markers[pd]||[]),'pagamento'];
          const plabel=p.label+' · '+j.client;
          info[pd]=info[pd]? (info[pd]+' · '+plabel) : plabel;
        }
      });
    });
    return {markers, info};
  }
  function mergedMonthData(m){ return dynamicEventsForMonth(m.year, m.month); }
  let calIndex=new Date().getMonth();
  let calFiltroAtivo='todos';
  let calDiaAtivo=null; /* dia selecionado no calendário (número) ou null */
  function diaHojeSeForOMes(m){
    const hoje=new Date();
    return (hoje.getFullYear()===m.year && hoje.getMonth()+1===m.month) ? hoje.getDate() : null;
  }
  function renderCalendar(){
    const m=calMonths[calIndex];
    const hojeReal=diaHojeSeForOMes(m);
    const merged=mergedMonthData(m);
    document.getElementById('cal-mes-label').textContent=mesCompleto(m.month-1);
    document.getElementById('cal-ano-label').textContent=String(m.year);
    document.getElementById('cal-prev').style.opacity = calIndex===0 ? '.15':'';
    document.getElementById('cal-prev').style.pointerEvents = calIndex===0 ? 'none':'';
    document.getElementById('cal-next').style.opacity = calIndex===calMonths.length-1 ? '.15':'';
    document.getElementById('cal-next').style.pointerEvents = calIndex===calMonths.length-1 ? 'none':'';
    const grid=document.getElementById('calgrid'); grid.innerHTML='';
    ['S','T','Q','Q','S','S','D'].forEach(d=>{const el=document.createElement('div');el.className='cal-dow';el.textContent=d;grid.appendChild(el)});
    for(let i=1;i<=m.days;i++){
      const day=document.createElement('div');
      day.className='cal-day'+(i===hojeReal?' today':'')+(i===calDiaAtivo?' cal-day-sel':'');
      day.innerHTML=i;
      if(merged.markers[i]){
        const dots=document.createElement('div'); dots.className='cal-dots';
        merged.markers[i].forEach(c=>{const dot=document.createElement('div');dot.className='cd';
          dot.style.background=corMarcadorCal(c);
          dots.appendChild(dot)});
        day.appendChild(dots);
      }
      /* só os dias com compromissos são clicáveis — clicar filtra a lista de
         cards abaixo por esse dia (e clicar de novo limpa) */
      if(merged.info[i]){ day.style.cursor='pointer'; day.onclick=()=>selecionarDiaCal(i); }
      else day.style.cursor='default';
      grid.appendChild(day);
    }
  }
  function selecionarDiaCal(i){
    calDiaAtivo = (calDiaAtivo===i) ? null : i;
    if(navigator.vibrate) navigator.vibrate(8);
    renderCalendar();
    aplicarFiltrosTrabalhos();
  }
  function calNav(dir){
    const next=calIndex+dir;
    if(next<0 || next>calMonths.length-1) return;
    calIndex=next;
    calDiaAtivo=null; /* o número do dia não faz sentido ao mudar de mês */
    renderCalendar();
    aplicarFiltrosTrabalhos();
  }
  /* Calendário de Projetos — deixou de ocupar espaço permanente na lista
     (ver reorganização da Dashboard de Tarefas); abre agora num
     .ov-dialog. renderCalendar()/calNav()/selecionarDiaCal() continuam
     exatamente iguais, só o container onde o resultado aparece mudou. */
  function abrirCalendarioProjetos(){
    renderCalendar();
    const scrim=document.getElementById('calendario-scrim'), dlg=document.getElementById('calendario-dialog');
    if(scrim) scrim.classList.remove('u-hidden');
    if(dlg) dlg.classList.remove('u-hidden');
  }
  function fecharCalendarioProjetos(){
    const scrim=document.getElementById('calendario-scrim'), dlg=document.getElementById('calendario-dialog');
    if(scrim) scrim.classList.add('u-hidden');
    if(dlg) dlg.classList.add('u-hidden');
  }

  /* Arrastar um bloco: o item segue o dedo/cursor em tempo real (translateY)
     e só troca de posição com o vizinho imediato quando o centro do bloco
     arrastado cruza o centro dele — nunca varre todos os blocos a cada
     movimento (era isso que causava trocas múltiplas e erráticas por
     evento, a experiência "abrupta" reportada). */

  /* ===== AJUSTE ROBUSTO DE LAYOUT — nunca mais barras a esconder conteúdo ===== */
  function ajustarPaddingEcra(){
    const topbar=document.querySelector('.topbar-mobile');
    const nav=document.querySelector('.nav');
    const root=document.documentElement;
    if(!topbar || !nav) return;
    const topbarOn = getComputedStyle(topbar).display!=='none';
    const navOn = getComputedStyle(nav).display!=='none';
    root.style.setProperty('--topbar-pad', topbarOn ? (topbar.offsetHeight+16)+'px' : '8px');
    root.style.setProperty('--nav-pad', navOn ? (nav.offsetHeight+24)+'px' : '40px');
  }

  /* ===== SPLASH =====
     Antes escondia num temporizador fixo (1050ms), independente de a
     verificação de sessão já ter terminado — se a rede estivesse mais lenta
     que isso, o splash saía antes da hora e expunha a landing page/ecrã de
     login por baixo durante uma fração de segundo antes de entrar na app,
     dando a impressão de "repetir os passos" a cada recarregamento. Agora só
     esconde quando authPronta (definido no onAuthStateChange) confirma que já
     sabemos se há sessão — com um tempo máximo de segurança para nunca
     prender a pessoa no logo se a rede/Supabase estiver mesmo lenta. */

  /* ===== LOGIN (Supabase Auth real) ===== */
  let ultimoEmailRegistado = '';
  function lpEntrar(){ document.getElementById('landing-page').style.display='none'; }
  function lpCriarConta(){ document.getElementById('landing-page').style.display='none'; mostrarEcraCriarConta(); }
  function mostrarEcraCriarConta(){
    document.getElementById('login-form-entrar').style.display='none';
    document.getElementById('login-form-reset').style.display='none';
    document.getElementById('login-form-criar').style.display='block';
    document.getElementById('signup-form-fields').style.display='block';
    document.getElementById('signup-aguardando').style.display='none';
  }
  function mostrarEcraEntrar(){
    document.getElementById('login-form-criar').style.display='none';
    document.getElementById('login-form-reset').style.display='none';
    document.getElementById('login-form-entrar').style.display='block';
  }
  function abrirResetPassword(){
    const emailAtual=document.getElementById('login-email').value.trim();
    document.getElementById('login-form-entrar').style.display='none';
    document.getElementById('login-form-criar').style.display='none';
    document.getElementById('login-form-reset').style.display='block';
    document.getElementById('reset-form-fields').style.display='block';
    document.getElementById('reset-enviado').style.display='none';
    document.getElementById('reset-err').style.display='none';
    document.getElementById('reset-email').value=emailAtual;
  }
  async function enviarResetPassword(){
    const email=document.getElementById('reset-email').value.trim();
    const err=document.getElementById('reset-err');
    if(!email){ err.querySelector('span').textContent=t('login.resetEmailNeeded'); err.style.display='block'; return; }
    err.style.display='none';
    const btn=document.getElementById('reset-btn');
    btn.disabled=true;
    try{
      await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    }catch(e){
      // erro real de rede/serviço — a Supabase não distingue "conta não existe" por segurança,
      // por isso qualquer outra falha (ex.: rate limit) ainda mostra a mesma mensagem genérica.
    }finally{
      btn.disabled=false;
      document.getElementById('reset-form-fields').style.display='none';
      document.getElementById('reset-enviado').style.display='block';
    }
  }
  async function salvarNovaPassword(){
    const p1=document.getElementById('newpass-1').value;
    const p2=document.getElementById('newpass-2').value;
    const err=document.getElementById('newpass-err');
    if(!p1 || !p2){ err.querySelector('span').textContent=t('signup.error'); err.style.display='block'; return; }
    if(!senhaForte(p1)){ err.querySelector('span').textContent=t('signup.weakPassword'); err.style.display='block'; return; }
    if(p1!==p2){ err.querySelector('span').textContent=t('signup.passwordMismatch'); err.style.display='block'; return; }
    err.style.display='none';
    const btn=document.getElementById('newpass-btn');
    btn.disabled=true; btn.textContent=t('signup.creating');
    try{
      const { error } = await sb.auth.updateUser({ password: p1 });
      if(error) throw error;
      showToast(t('login.newPasswordSaved'));
      document.getElementById('login-form-newpass').style.display='none';
    }catch(e){
      err.querySelector('span').textContent=e.message||t('signup.genericError');
      err.style.display='block';
    }finally{
      btn.disabled=false; btn.textContent=t('login.saveNewPassword');
    }
  }
  async function entrarNaApp(){
    const email=document.getElementById('login-email').value.trim();
    const pass=document.getElementById('login-pass').value;
    const err=document.getElementById('login-err');
    if(!email || !pass){ err.querySelector('span').textContent='Preenche o email e a password.'; err.style.display='block'; return; }
    err.style.display='none';
    try{
      await pivotSignIn(email, pass);
      document.getElementById('login-screen').classList.add('hide');
    }catch(e){
      const msg = /confirm/i.test(e.message||'') ? 'Confirma o teu email antes de entrares — verifica a tua caixa de entrada.'
        : /workspace/i.test(e.message||'') ? e.message
        : 'Email ou password incorretos.';
      err.querySelector('span').textContent = msg;
      err.style.display='block';
    }
  }
  function senhaForte(pass){
    return pass.length>=8 && /[a-zA-Z]/.test(pass) && /[0-9]/.test(pass);
  }
  async function criarContaNaApp(){
    const nome=document.getElementById('signup-nome').value.trim();
    const email=document.getElementById('signup-email').value.trim();
    const pass=document.getElementById('signup-pass').value;
    const pass2=document.getElementById('signup-pass2').value;
    const err=document.getElementById('signup-err');
    const btn=document.getElementById('signup-btn');

    if(!nome || !email || !pass || !pass2){
      err.querySelector('span').textContent=t('signup.error'); err.style.display='block'; return;
    }
    if(!senhaForte(pass)){
      err.querySelector('span').textContent=t('signup.weakPassword'); err.style.display='block'; return;
    }
    if(pass!==pass2){
      err.querySelector('span').textContent=t('signup.passwordMismatch'); err.style.display='block'; return;
    }
    const termosOk=document.getElementById('signup-termos')?.checked;
    const privOk=document.getElementById('signup-privacidade')?.checked;
    if(!termosOk||!privOk){
      err.querySelector('span').textContent=t('invite.fillError'); err.style.display='block'; return;
    }
    err.style.display='none';
    btn.disabled=true; btn.textContent=t('signup.creating');

    try{
      /* Em vez de sb.auth.signUp() (que depende do SMTP embutido da Supabase
         para o email de confirmação sair — o mesmo problema já resolvido para
         convites de equipa), a conta é criada no servidor e o email de
         confirmação sai pelo Resend, com o template Pivots. Ver
         api/auth/signup.js. */
      const res=await fetch('/api/auth/signup', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email, password:pass, nome})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok || !body.ok){
        throw new Error(res.status===409 ? t('signup.emailTaken') : (body.error || t('signup.genericError')));
      }
      // Confirmação de email exigida: mostra ecrã claro de "verifica o teu email", não um toast que passa despercebido.
      ultimoEmailRegistado = email;
      document.getElementById('signup-email-enviado').textContent = email;
      document.getElementById('signup-form-fields').style.display='none';
      document.getElementById('signup-aguardando').style.display='block';
      if(body.emailEnviado===false) showToast(t('toast.emailFailed'));
    }catch(e){
      const rateLimited = /security purposes|rate limit/i.test(e.message||'');
      err.querySelector('span').textContent = rateLimited ? t('signup.rateLimited') : (e.message || t('signup.genericError'));
      err.style.display='block';
    }finally{
      btn.disabled=false; btn.textContent=t('login.register');
    }
  }
  async function reenviarEmailConfirmacao(){
    const btn=document.getElementById('signup-reenviar-btn');
    if(!ultimoEmailRegistado) return;
    btn.disabled=true; btn.textContent=t('signup.sending');
    try{
      const res=await fetch('/api/auth/resend', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email: ultimoEmailRegistado})});
      const body=await res.json().catch(()=>({}));
      showToast((res.ok && body.ok && body.emailEnviado!==false) ? t('signup.resendDone') : t('signup.resendWait'));
    }catch(e){
      showToast(t('signup.resendError'));
    }finally{
      btn.disabled=false; btn.textContent=t('signup.resendEmail');
    }
  }
  /* ===== Conclusão de convite de equipa =====
     O link do convite (api/team/invite.js) já autentica a pessoa ao ser
     aberto — a Supabase confirma o email como parte da verificação do token,
     por isso não precisamos de um passo de confirmação à parte. O que falta
     é a pessoa escolher a password e o nome, e aceitar os termos, antes de
     entrar na app — sem isto, ficava logo dentro de uma conta em branco
     (sem nome, sem password própria), parecendo uma conta de amostra. */
  function abrirCompletarConvite(session){
    const email = session && session.user && session.user.email;
    const emailEl=document.getElementById('cc-email');
    if(emailEl) emailEl.value = email||'';
    const tela=document.getElementById('completar-convite-screen');
    if(tela) tela.style.display='flex';
  }
  async function concluirCadastroConvite(){
    const nome=document.getElementById('cc-nome').value.trim();
    const pass=document.getElementById('cc-pass').value;
    const pass2=document.getElementById('cc-pass2').value;
    const termos=document.getElementById('cc-termos').checked;
    const cookies=document.getElementById('cc-cookies').checked;
    const err=document.getElementById('cc-err');
    const btn=document.getElementById('cc-btn');

    if(!nome || !pass || !pass2 || !termos || !cookies){
      err.querySelector('span').textContent=t('invite.fillError'); err.style.display='block'; return;
    }
    if(!senhaForte(pass)){
      err.querySelector('span').textContent=t('signup.weakPassword'); err.style.display='block'; return;
    }
    if(pass!==pass2){
      err.querySelector('span').textContent=t('signup.passwordMismatch'); err.style.display='block'; return;
    }
    err.style.display='none';
    btn.disabled=true; btn.textContent=t('invite.completing');

    try{
      const { error } = await sb.auth.updateUser({ password: pass, data:{ nome } });
      if(error) throw error;
      if(typeof perfilData!=='undefined' && perfilData){
        perfilData.nome = nome;
        perfilData.termosAceitesEm = new Date().toISOString();
        perfilData.cookiesAceitesEm = new Date().toISOString();
        if(typeof savePerfilData==='function') savePerfilData();
        if(typeof aplicarPerfilData==='function') aplicarPerfilData();
      }
      precisaCompletarConvite=false;
      /* limpa o ?convite=1 da barra de endereço — sem isto, um recarregar da
         página voltaria a mostrar este ecrã mesmo já com a conta concluída */
      const url=new URL(window.location.href);
      url.searchParams.delete('convite');
      history.replaceState({}, '', url.toString());
      const tela=document.getElementById('completar-convite-screen');
      if(tela) tela.style.display='none';
      showToast(t('toast.inviteCompleted'));
    }catch(e){
      err.querySelector('span').textContent = e.message || t('signup.genericError');
      err.style.display='block';
    }finally{
      btn.disabled=false; btn.textContent=t('invite.completeBtn');
    }
  }
  function terminarSessao(){
    pivotSignOut();
  }
  // No arranque, o onAuthStateChange dispara automaticamente se já existir uma
  // sessão guardada — não é preciso verificar manualmente aqui (fonte única de verdade).

  // Todos os dados da conta só são lidos depois de currentWorkspaceId estar definido
  // (ver carregarWorkspace) — carregar antes disso devolve sempre null e a conta
  // parece "vazia"/com valores por defeito mesmo tendo dados guardados.
  async function carregarDadosDaConta(){
    /* loadEquipaData primeiro: define meuPapel, do qual jobsVisiveis() depende
       para filtrar a lista de trabalhos assim que ela é renderizada abaixo. */
    await loadEquipaData();
    await Promise.all([
      loadJobsData(), loadClientesData(), loadTarefasData(), loadLembretesData(), loadListasData(), loadCustosData(), loadReceitasData(),
      loadPerfilData(), loadMetas(), loadPesquisasRecentes(),
      loadReferenciasData(), loadModelosUsoData(), loadModelosContratoData(), loadTema(), carregarMinhasColaboracoes(), loadBibFavoritos(), loadNotifDismissed(), loadServicosData(), loadCatalogoPersonalizado(),
      loadNotificacoesData()
    ]);
    renderMonthTicker();
    renderDashCustomCards();
    renderNotificacoesPendentes();
  }
  function aplicarTema(tema){
    document.documentElement.setAttribute('data-theme', tema);
  }
  /* app com um único modo de cor (escuro) — o antigo toggle claro/escuro
     saiu do Perfil; isto só garante que data-theme fica sempre "dark". */
  async function loadTema(){ aplicarTema('dark'); }
