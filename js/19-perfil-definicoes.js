/* Pivots — perfil definicoes
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* ===== INFO SHEET — Perfil, Builder (funções reais e contidas) ===== */
  function openInfo(title, bodyHtml, onBack, titleClass, dockHtml){
    _omOpen('info', function(){
      document.getElementById('infoSheet').classList.remove('vis-glass-mode');
      document.getElementById('infoOverlay').classList.remove('vis-glass-mode');
      document.getElementById('infoDock').innerHTML=dockHtml||'';
      const titleEl=document.getElementById('infoTitle');
      titleEl.textContent=title;
      titleEl.className = titleClass||'';
      document.getElementById('infoBody').innerHTML=bodyHtml;
      document.getElementById('infoOverlay').classList.add('show');
      document.getElementById('infoSheet').classList.add('show');
      window.__infoBackHandler = onBack||null;
      document.getElementById('infoBackBtn').style.display = onBack ? 'flex' : 'none';
      document.querySelectorAll('#infoBody [data-t]').forEach(el=>{
        const val=t(el.dataset.t);
        if(val&&val!==el.dataset.t)el.textContent=val;
      });
      document.querySelectorAll('#infoBody [data-t-placeholder]').forEach(el=>{
        const val=t(el.dataset.tPlaceholder);
        if(val)el.placeholder=val;
      });
    });
  }
  function closeInfo(){
    _omClose('info', function(){
      document.getElementById('infoOverlay').classList.remove('show');
      document.getElementById('infoSheet').classList.remove('show');
      window.__infoBackHandler=null;
      document.getElementById('infoBackBtn').style.display='none';
    });
  }
  function infoMinhaConta(){
    openInfo(t('profile.myAccount'), `
      <div class="field"><label>${t('profile.account.name')}</label><input value="${escapeHtml(perfilData.nome)}" id="mc-nome"></div>
      <div class="field"><label>Email</label><input value="${escapeHtml(perfilData.email)}" id="mc-email"></div>
      <div class="field"><label>${t('profile.account.phone')}</label><input value="${escapeHtml(perfilData.telefonePessoal||'')}" id="mc-telefone"></div>
      <div class="field"><label>${t('profile.account.docId')}</label><input value="${escapeHtml(perfilData.documentoNacional||'')}" id="mc-doc"></div>
      <button class="btn primary" style="width:100%;margin-top:2px" onclick="salvarMinhaConta()">${t('profile.account.save')}</button>
      <button class="btn soft u-w-full u-mt-8" onclick="abrirAlterarSenha()">${t('profile.account.changePassword')}</button>`);
  }
  function infoPlano(){
    const planoAtual = perfilData.plano||'Free';
    const linhasPlano = Object.keys(PLANOS).map(nome=>{
      const p=PLANOS[nome];
      const atual = nome===planoAtual;
      const estilo = atual ? ' style="border-color:var(--brand);background:var(--brand-10)"' : '';
      const onclick = atual ? '' : ` onclick="escolherPlano('${nome}')"`;
      return `<div class="pick-row"${estilo}${onclick}><div><div class="nm">${t(p.labelKey)}${atual?t('plan.current'):''}</div><div class="sub">${t(p.descKey)}</div></div></div>`;
    }).join('');
    openInfo(t('profile.plan'), `
      <p class="plabel" style="margin:0 2px 9px">${t('profile.account.plan')}</p>
      ${linhasPlano}
      <p class="plabel" style="margin:18px 2px 9px">${t('profile.account.redeemLabel')}</p>
      <div class="u-flex-g8">
        <div class="field" style="flex:1;margin-bottom:0"><input id="mc-codigo" placeholder="${t('profile.account.redeemPlaceholder')}" style="text-transform:uppercase" onkeydown="if(event.key==='Enter')resgatarCodigoPlano()"></div>
        <button class="btn soft u-flex-none" onclick="resgatarCodigoPlano()">${t('profile.account.redeemBtn')}</button>
      </div>
      <p class="plabel" style="margin:22px 2px 9px">${t('profile.plan.billingHistory')}</p>
      <p style="font-size:13px;color:var(--ink-soft);margin:0 2px 6px">${t('profile.plan.nextRenewal')}: ${perfilData.plano==='Free'?'—':(perfilData.proximaRenovacao||'—')}</p>`);
  }
  function abrirAlterarSenha(){
    openInfo(t('profile.account.changePassword'), `
      <div class="field"><label>${t('login.newPassword')}</label><input type="password" id="ap-senha1"></div>
      <div class="field"><label>${t('login.confirmPassword')}</label><input type="password" id="ap-senha2"></div>
      <button class="btn primary u-w-full u-mt-12" onclick="confirmarAlterarSenha()">${t('profile.account.save')}</button>`);
  }
  async function confirmarAlterarSenha(){
    const s1=document.getElementById('ap-senha1').value, s2=document.getElementById('ap-senha2').value;
    if(!s1 || s1.length<6){ showToast(t('toast.passwordTooShort')); return; }
    if(s1!==s2){ showToast(t('toast.passwordMismatch')); return; }
    const { error } = await sb.auth.updateUser({ password:s1 });
    if(error){ showToast(t('toast.passwordUpdateError')); return; }
    closeInfo(); showToast(t('toast.passwordUpdated'));
  }
  async function resgatarCodigoPlano(){
    const input=document.getElementById('mc-codigo');
    const code=input.value.trim();
    if(!code){ showToast(t('toast.redeemEmptyCode')); return; }
    try{
      const { data:sessionData } = await sb.auth.getSession();
      const access_token = sessionData && sessionData.session && sessionData.session.access_token;
      const res=await fetch('/api/billing/redeem', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({access_token, workspace_id:currentWorkspaceId, code})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok || !body.ok){ showToast(res.status===404?t('toast.redeemInvalid'):t('toast.redeemError')); return; }
      perfilData.plano=body.plano;
      savePerfilData();
      aplicarPerfilData();
      closeInfo();
      showToast(t('toast.redeemSuccessPrefix')+body.plano+t('toast.redeemSuccessSuffix'));
    }catch(e){ showToast(t('toast.redeemError')); }
  }
  function infoEmpresa(){
    if(!souAdmin()){ showToast(t('team.onlyAdminInvites')); return; }
    openInfo(t('profile.company'), `
      <div style="text-align:center;margin-bottom:16px">
        <div class="p-avatar" id="empresa-avatar-preview" style="width:64px;height:64px;font-size:22px;margin:0 auto 8px;${perfilData.empresaFotoUrl?('background-image:url('+perfilData.empresaFotoUrl+');background-size:cover;background-position:center'):''}">${perfilData.empresaFotoUrl?'':escapeHtml((perfilData.empresa||'?').charAt(0).toUpperCase())}</div>
        <label class="inline-link u-cur-pointer">${t('profile.company.changeLogo')}<input type="file" accept="image/*" style="display:none" onchange="onEmpresaAvatarSelected(this)"></label>
      </div>
      <div class="field"><label>${t('profile.account.company')}</label><input value="${escapeHtml(perfilData.empresa)}" id="emp-nome"></div>
      <div class="field"><label>${t('profile.company.address')}</label><input value="${escapeHtml(perfilData.endereco||'')}" id="emp-endereco"></div>
      <div class="field"><label>${t('profile.company.category')}</label><input value="${escapeHtml(perfilData.categoria)}" id="emp-categoria" placeholder="${t('profile.company.categoryPlaceholder')}"></div>
      <div class="field"><label>Email</label><input value="${escapeHtml(perfilData.empresaEmail||'')}" id="emp-email"></div>
      <div class="field"><label>${t('profile.company.phone')}</label><input value="${escapeHtml(perfilData.telefone)}" id="emp-telefone"></div>
      <div class="field"><label>${t('profile.company.website')}</label><input value="${escapeHtml(perfilData.website)}" id="emp-website"></div>
      <div class="field"><label>${t('profile.company.taxId')}</label><input value="${escapeHtml(perfilData.taxId||'')}" id="emp-taxid" placeholder="${t('profile.company.taxIdPlaceholder')}"></div>
      <button class="btn primary u-w-full u-mt-12" onclick="salvarEmpresa()">${t('profile.account.save')}</button>`);
  }
  async function onEmpresaAvatarSelected(input){
    const file=input.files[0]; if(!file) return;
    try{
      const dataUrl=await arquivoParaDataUrlComprimido(file);
      const url=await enviarImagemParaStorage(dataUrl, 'empresa-logo');
      perfilData.empresaFotoUrl=url;
      savePerfilData();
      const prev=document.getElementById('empresa-avatar-preview');
      if(prev){ prev.style.backgroundImage='url('+url+')'; prev.style.backgroundSize='cover'; prev.style.backgroundPosition='center'; prev.textContent=''; }
      showToast(t('toast.profilePhotoUpdated'));
    }catch(e){ showToast(t('toast.imageError')); }
    input.value='';
  }
  function salvarEmpresa(){
    perfilData.empresa=document.getElementById('emp-nome').value.trim();
    perfilData.endereco=document.getElementById('emp-endereco').value.trim();
    perfilData.categoria=document.getElementById('emp-categoria').value.trim();
    perfilData.empresaEmail=document.getElementById('emp-email').value.trim();
    perfilData.telefone=document.getElementById('emp-telefone').value.trim();
    perfilData.website=document.getElementById('emp-website').value.trim();
    perfilData.taxId=document.getElementById('emp-taxid').value.trim();
    savePerfilData();
    aplicarPerfilData();
    renderOrgHead();
    closeInfo(); showToast(t('toast.accountDataUpdated'));
  }
  function escolherPlano(nome){
    if(nome==='Free'){
      perfilData.plano='Free';
      savePerfilData();
      aplicarPerfilData();
      closeInfo();
      showToast(t('toast.planChangedFree'));
      return;
    }
    if(nome==='Enterprise'){
      showToast(t('plan.contactSales'));
      return;
    }
    abrirCheckoutPlano(nome);
  }
  async function abrirCheckoutPlano(plano){
    showToast(t('plan.openingCheckout'));
    try{
      const { data:sessionData } = await sb.auth.getSession();
      const access_token = sessionData && sessionData.session && sessionData.session.access_token;
      const res=await fetch('/api/billing/create-checkout-session', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({access_token, workspace_id:currentWorkspaceId, plano})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok || !body.url){ showToast(body.error || t('plan.checkoutError')); return; }
      window.location.href = body.url;
    }catch(e){ showToast(t('plan.checkoutError')); }
  }
  function salvarMinhaConta(){
    perfilData.nome=document.getElementById('mc-nome').value.trim()||'Utilizador';
    perfilData.email=document.getElementById('mc-email').value.trim();
    perfilData.telefonePessoal=document.getElementById('mc-telefone').value.trim();
    perfilData.documentoNacional=document.getElementById('mc-doc').value.trim();
    savePerfilData();
    aplicarPerfilData();
    closeInfo(); showToast(t('toast.accountDataUpdated'));
  }
  function infoMetodosPagamento(){
    const mp=perfilData.metodosPagamento;
    const linhas=METODOS_PAGAMENTO_META.map(([key,labelKey,placeholder,icone])=>{
      const m=mp[key]||(mp[key]={ativo:false,valor:'',padrao:false});
      return '<div class="struct-row" style="flex-direction:column;align-items:stretch;gap:8px;padding:14px 2px">'+
        '<div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:9px"><span style="width:28px;height:28px;border-radius:var(--r);flex:none;display:grid;place-items:center;background:var(--brand-10)"><span style="width:16px;height:16px;display:inline-block;background-color:var(--brand);mask-image:url('+icone+');-webkit-mask-image:url('+icone+');mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center"></span></span><div class="nm">'+t(labelKey)+'</div></div>'+
        '<div class="toggle'+(m.ativo?' on':'')+'" onclick="this.classList.toggle(\'on\')" id="mp-ativo-'+key+'"><div class="kn"></div></div></div>'+
        '<div class="field u-mb-0"><input id="mp-valor-'+key+'" placeholder="'+placeholder+'" value="'+escapeHtml(m.valor||'')+'"></div>'+
        '<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-soft)"><input type="checkbox" id="mp-padrao-'+key+'" '+(m.padrao?'checked':'')+' style="accent-color:var(--brand)"> '+t('payment.method.sendByDefault')+'</label>'+
        '</div>';
    }).join('');
    openInfo(t('profile.paymentMethods'), `
      <p class="u-label-soft u-mb-12">${t('payment.method.hint')}</p>
      ${linhas}
      <button class="btn primary u-w-full u-mt-10" onclick="guardarMetodosPagamento()">${t('action.save')}</button>`);
  }
  function guardarMetodosPagamento(){
    METODOS_PAGAMENTO_META.forEach(([key])=>{
      perfilData.metodosPagamento[key] = {
        ativo: document.getElementById('mp-ativo-'+key).classList.contains('on'),
        valor: document.getElementById('mp-valor-'+key).value.trim(),
        padrao: document.getElementById('mp-padrao-'+key).checked
      };
    });
    savePerfilData();
    closeInfo();
    showToast(t('toast.settingsSaved'));
  }
  function infoServicos(){
    const linhas = servicosData.length ? servicosData.map(s=>
      '<div class="prow" onclick="abrirNovoServico(\''+s.id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.5 7.5 12 12 3.5 7.5"/><path d="M12 12v9"/><path d="m20.5 7.5-8.5-4.5-8.5 4.5 8.5 4.5 8.5-4.5Z"/></svg>'+
      '<div class="t">'+escapeHtml(s.nome)+'</div>'+
      (s.valor ? '<div class="v">'+fmtMoney(s.valor)+'</div>' : '')+
      '<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 6 6 6-6 6"/></svg></div>'
    ).join('') : '<p class="u-label-soft u-p-4-2">'+t('services.empty')+'</p>';
    openInfo(t('profile.services'), `
      <p class="u-label-soft u-mb-12">${t('services.hint')}</p>
      <div class="plist">${linhas}</div>
      <button class="btn primary u-w-full u-mt-14" onclick="abrirNovoServico()">${t('services.new')}</button>`);
  }
  function abrirNovoServico(id){
    const s = id ? servicosData.find(x=>x.id===id) : null;
    openInfo(s ? t('services.edit') : t('services.new'), `
      <div class="field"><label>${t('services.name')}</label><input id="srv-nome" value="${s?escapeHtml(s.nome):''}"></div>
      <div class="field"><label>${t('services.category')}</label><input id="srv-categoria" value="${s?escapeHtml(s.categoria||''):''}"></div>
      <div class="field"><label>${t('services.description')}</label><textarea id="srv-desc" rows="3">${s?escapeHtml(s.descricao||''):''}</textarea></div>
      <div class="field"><label>${t('services.price')}</label><input id="srv-valor" type="number" min="0" step="0.01" value="${s&&s.valor?s.valor:''}"></div>
      <input type="hidden" id="srv-id" value="${s?s.id:''}">
      <button class="btn primary u-w-full u-mt-10" onclick="guardarServico()">${t('action.save')}</button>
      ${s ? '<button class="btn" style="width:100%;margin-top:8px;color:var(--late)" onclick="excluirServico(\''+s.id+'\')">'+t('services.delete')+'</button>' : ''}`);
  }
  function guardarServico(){
    const nome=document.getElementById('srv-nome').value.trim();
    if(!nome){ showToast(t('services.nameRequired')); return; }
    const categoria=document.getElementById('srv-categoria').value.trim();
    const descricao=document.getElementById('srv-desc').value.trim();
    const valor=parseFloat(document.getElementById('srv-valor').value)||0;
    const id=document.getElementById('srv-id').value;
    if(id){
      const s=servicosData.find(x=>x.id===id);
      if(s){ s.nome=nome; s.categoria=categoria; s.descricao=descricao; s.valor=valor; }
    } else {
      servicosData.push({ id:'srv'+Date.now()+Math.random().toString(36).slice(2,7), nome, categoria, descricao, valor });
    }
    saveServicosData();
    showToast(t('toast.serviceSaved'));
    infoServicos();
  }
  function excluirServico(id){
    servicosData = servicosData.filter(x=>x.id!==id);
    saveServicosData();
    showToast(t('toast.serviceDeleted'));
    infoServicos();
  }
  function infoAssinatura(){
    const tem=!!perfilData.assinaturaImg;
    openInfo(t('modal.signature'), `
      <div id="perfil-sig-preview" style="border:1px solid var(--line);border-radius:var(--r);padding:18px;text-align:center;margin-bottom:14px;min-height:60px;display:flex;align-items:center;justify-content:center">
        ${tem? '<img src="'+perfilData.assinaturaImg+'" style="max-width:100%;max-height:80px">' : '<span class="u-sm-nd">'+t('signature.noneYet')+'</span>'}
      </div>
      <div class="segmented">
        <button class="on" id="perfil-sig-tab-desenhar" onclick="setAssinaturaTab(this,'desenhar')">${t('signature.tabDraw')}</button>
        <button id="perfil-sig-tab-upload" onclick="setAssinaturaTab(this,'upload')">${t('signature.tabUpload')}</button>
      </div>
      <div id="perfil-sig-desenhar">
        <div class="sig-pad-wrap"><canvas id="perfil-sig-canvas"></canvas><span class="sig-pad-clear" onclick="limparAssinaturaCanvasPerfil()">${t('signature.clear')}</span></div>
        <button class="btn primary u-w-full u-mt-10" onclick="guardarAssinaturaDesenhadaPerfil()">${t('action.saveSignature')}</button>
      </div>
      <div id="perfil-sig-upload" style="display:none">
        <input type="file" id="perfil-sig-file-input" accept="image/*" style="display:none" onchange="onAssinaturaFileSelected(this)">
        <div class="dropzone" onclick="document.getElementById('perfil-sig-file-input').click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>
          <div class="t">${t('signature.tabUpload')}</div><div class="s">${t('signature.uploadHint')}</div>
        </div>
      </div>
      <div class="struct-row u-mt-18"><div class="struct-l"><div class="nm">${t('profile.signatureRequireDocId')}</div></div><div class="toggle${perfilData.exigirDocumentoAssinaturaPadrao?' on':''}" onclick="this.classList.toggle('on');perfilData.exigirDocumentoAssinaturaPadrao=this.classList.contains('on');savePerfilData()" id="assinatura-exigir-doc"><div class="kn"></div></div></div>`);
    setTimeout(inicializarCanvasAssinaturaPerfil, 30);
  }
  function setAssinaturaTab(el,tab){
    document.getElementById('perfil-sig-tab-desenhar').classList.toggle('on', tab==='desenhar');
    document.getElementById('perfil-sig-tab-upload').classList.toggle('on', tab==='upload');
    document.getElementById('perfil-sig-desenhar').style.display = tab==='desenhar' ? 'block':'none';
    document.getElementById('perfil-sig-upload').style.display = tab==='upload' ? 'block':'none';
    if(tab==='desenhar') setTimeout(inicializarCanvasAssinaturaPerfil, 30);
  }
  let perfilSigCanvasCtx=null, perfilSigDrawing=false, perfilSigHasDrawing=false;
  function inicializarCanvasAssinaturaPerfil(){
    const canvas=document.getElementById('perfil-sig-canvas');
    if(!canvas) return;
    canvas.dataset.bound='';
    perfilSigHasDrawing=false;
    const dpr=window.devicePixelRatio||1;
    const rect=canvas.getBoundingClientRect();
    canvas.width=rect.width*dpr; canvas.height=110*dpr;
    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    ctx.strokeStyle=document.documentElement.getAttribute('data-theme')==='dark'?'#EAEDEC':'#15261C'; ctx.lineWidth=2.2; ctx.lineCap='round'; ctx.lineJoin='round';
    perfilSigCanvasCtx=ctx;
    let lastX=0, lastY=0;
    const pos=e=>{ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; };
    canvas.onpointerdown=e=>{ perfilSigDrawing=true; const p=pos(e); lastX=p.x; lastY=p.y; };
    canvas.onpointermove=e=>{
      if(!perfilSigDrawing) return;
      const p=pos(e);
      ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
      lastX=p.x; lastY=p.y; perfilSigHasDrawing=true;
    };
    const parar=()=>{ perfilSigDrawing=false; };
    canvas.onpointerup=parar; canvas.onpointerleave=parar;
  }
  function limparAssinaturaCanvasPerfil(){
    const canvas=document.getElementById('perfil-sig-canvas');
    if(!canvas || !perfilSigCanvasCtx) return;
    perfilSigCanvasCtx.clearRect(0,0,canvas.width,canvas.height);
    perfilSigHasDrawing=false;
  }
  function guardarAssinaturaDesenhadaPerfil(){
    if(!perfilSigHasDrawing){ showToast(t('toast.drawSignatureFirst')); return; }
    const canvas=document.getElementById('perfil-sig-canvas');
    perfilData.assinaturaImg=canvas.toDataURL('image/png');
    savePerfilData();
    closeInfo();
    showToast(t('toast.signatureSaved'));
  }
  async function onAssinaturaFileSelected(input){
    const file=input.files[0]; if(!file) return;
    try{
      const dataUrl=await arquivoParaDataUrlComprimido(file);
      perfilData.assinaturaImg=dataUrl;
      savePerfilData();
      closeInfo();
      showToast(t('toast.signatureSaved'));
    }catch(e){ showToast(t('toast.imageError')); }
  }
  function infoIdioma(){
    const langMap = {'Português':'pt','English':'en','Español':'es'};
    const atual = langMap[perfilData.idiomaUI] || 'pt';
    openInfo(t('lang.selector'), `
      <div class="pick-row${atual==='pt'?' selected':''}" onclick="setIdiomaUI('Português')"><div class="nm">${t('lang.pt')}</div><svg class="lang-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg></div>
      <div class="pick-row${atual==='en'?' selected':''}" onclick="setIdiomaUI('English')"><div class="nm">${t('lang.en')}</div><svg class="lang-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg></div>
      <div class="pick-row${atual==='es'?' selected':''}" onclick="setIdiomaUI('Español')"><div class="nm">${t('lang.es')}</div><svg class="lang-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg></div>
    `);
  }
  function setIdiomaUI(nome){
    const langMap = {'Português':'pt','English':'en','Español':'es'};
    const langCode = langMap[nome] || 'pt';
    LANG = langCode;
    perfilData.idiomaUI = nome;
    /* O idioma do portal do cliente segue o idioma da app por defeito —
       só deixa de seguir depois do utilizador o escolher explicitamente
       (via clienteSetIdioma/setIdioma), marcado por idiomaPortalCustom. */
    if(!perfilData.idiomaPortalCustom) perfilData.idiomaPortal = nome;
    savePerfilData();
    const v = document.getElementById('pf-idioma-v'); if(v) v.textContent = nome;
    closeInfo();
    showToast(nome);
    aplicarPerfilData();
    aplicarTraducaoCompleta();
  }
  /* compatibilidade retroactiva */
  function aplicarIdiomaUI(){ aplicarTraducaoCompleta(); }
  function setIdioma(nome){
    perfilData.idiomaPortal=nome;
    perfilData.idiomaPortalCustom=true;
    savePerfilData();
    closeInfo();
    showToast(t('toast.portalLang')+nome);
    if(document.getElementById('clientwrap').classList.contains('show') && clientContext){
      renderClientDynamic(clientContext);
    }
  }
  const LIMITE_ARMAZENAMENTO_MB={Free:25, Plus:50, Pro:100, Business:500, Enterprise:Infinity};
  async function calcularArmazenamentoUsadoMB(){
    const chaves=['pivot-jobsData','pivot-clientesData','pivot-tarefasData','pivot-lembretesData','pivot-listasData','pivot-custosData',
      'pivot-referenciasData','pivot-modelosUso','pivot-perfilData'];
    let bytes=0;
    for(const chave of chaves){
      const valor=await StorageAdapter.load(chave);
      if(valor!=null) bytes += new Blob([JSON.stringify(valor)]).size;
    }
    return bytes/(1024*1024);
  }
  function infoConfiguracoes(){
    openInfo(t('settings.title'), `
      <div class="field"><label>${t('field.timezone')}</label><select id="cfg-timezone">${['UTC','America/New_York','America/Los_Angeles','Europe/London','Europe/Lisbon','Europe/Madrid','Asia/Tokyo','Australia/Sydney'].map(tz=>'<option'+(perfilData.timezone===tz?' selected':'')+'>'+tz+'</option>').join('')}</select></div>
      <div class="field"><label>${t('field.dateFormat')}</label><select id="cfg-dateformat">
        <option value="DD/MM/YYYY"${perfilData.dateFormat==='DD/MM/YYYY'?' selected':''}>31/12/2026</option>
        <option value="YYYY-MM-DD"${perfilData.dateFormat==='YYYY-MM-DD'?' selected':''}>2026-12-31</option>
        <option value="MMM DD, YYYY"${perfilData.dateFormat==='MMM DD, YYYY'?' selected':''}>Dec 31, 2026</option></select></div>
      <div class="field"><label>${t('field.currency')}</label><select id="cfg-moeda">
        <option value="EUR"${perfilData.moeda==='EUR'?' selected':''}>€ Euro</option>
        <option value="USD"${perfilData.moeda==='USD'?' selected':''}>${t('currency.dollar')}</option>
        <option value="BRL"${perfilData.moeda==='BRL'?' selected':''}>${t('currency.real')}</option></select></div>
      <button class="btn primary u-w-full u-mt-6" onclick="guardarConfiguracoes()">${t('action.save')}</button>
      <div class="prow u-mt-18" onclick="infoIdioma()"><span class="nav-ico" style="width:18px;height:18px;display:inline-block;mask-image:url(https://api.iconify.design/cil:language.svg);-webkit-mask-image:url(https://api.iconify.design/cil:language.svg)"></span><div class="t" data-t="profile.language">Idioma</div><svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
      <p class="plabel" style="margin:18px 2px 8px;display:flex;align-items:center;gap:6px"><span class="nav-ico" style="width:14px;height:14px;display:inline-block;background-color:var(--neutral);mask-image:url(https://api.iconify.design/tdesign:hard-disk-storage-filled.svg);-webkit-mask-image:url(https://api.iconify.design/tdesign:hard-disk-storage-filled.svg)"></span>${t('settings.storageTitle')}</p>
      <div id="cfg-storage-bar" style="background:var(--paper-2);border-radius:var(--r);height:8px;overflow:hidden;margin-bottom:6px"><div style="height:100%;width:0%;background:var(--brand)"></div></div>
      <p id="cfg-storage-pct" style="font-size:12.5px;color:var(--ink-soft);margin:0">…</p>`);
    calcularArmazenamentoUsadoMB().then(usadoMB=>{
      const limiteMB=LIMITE_ARMAZENAMENTO_MB[perfilData.plano||'Free'];
      const pctUso=limiteMB===Infinity?0:Math.min(100,Math.round(usadoMB/limiteMB*100));
      const bar=document.getElementById('cfg-storage-bar');
      const pct=document.getElementById('cfg-storage-pct');
      if(bar) bar.innerHTML='<div style="height:100%;width:'+pctUso+'%;background:'+(pctUso>90?'var(--late)':'var(--brand)')+'"></div>';
      if(pct) pct.textContent=pctUso+'%';
    });
  }
  function guardarConfiguracoes(){
    perfilData.timezone=document.getElementById('cfg-timezone').value;
    perfilData.dateFormat=document.getElementById('cfg-dateformat').value;
    perfilData.moeda=document.getElementById('cfg-moeda').value;
    savePerfilData();
    closeInfo();
    showToast(t('toast.settingsSaved'));
  }
  /* ===== Sincronização de Calendário =====
     Um único link .ics privado por workspace (api/calendar/feed.js) — o
     mesmo link funciona em Google Calendar, Apple Calendar, Outlook e
     qualquer app que suporte "assinar calendário por URL". Cada app
     verifica o link periodicamente sozinho; o Pivots nunca escreve nem lê
     nada nos calendários de terceiros, só serve este feed.
     Deliberadamente SEM OAuth: uma ligação direta por API exigiria um app
     verificado pela Google (ou testadores cadastrados manualmente e ainda
     assim sujeito a bloqueios de "app não verificado"), o que é mais
     fricção do que vale a pena para o que é, no fundo, "colocar meus
     compromissos num calendário". Um link resolve todos os apps de uma
     vez, sem depender de aprovação de terceiros. */
  function urlFeedCalendario(token){
    return window.location.origin+'/api/calendar/feed?token='+token;
  }
  async function infoSincronizacaoCalendario(){
    openInfo(t('settings.calendarSync'), '<p style="font-size:13px;color:var(--ink-soft);padding:20px 2px;text-align:center">'+t('sync.loading')+'</p>');
    const { data, error } = await sb.from('calendar_feed_tokens').select('token').eq('workspace_id', currentWorkspaceId).eq('revoked', false).order('created_at', {ascending:false}).limit(1);
    let token = (!error && data && data[0]) ? data[0].token : null;
    if(!token){
      const novoToken=(crypto.randomUUID?crypto.randomUUID():'tok'+Date.now()+Math.random().toString(36).slice(2)).replace(/-/g,'');
      const { error:insErr } = await sb.from('calendar_feed_tokens').insert({token:novoToken, workspace_id:currentWorkspaceId});
      if(!insErr) token=novoToken;
    }
    renderInfoSincronizacaoCalendario(token);
  }
  function renderInfoSincronizacaoCalendario(token){
    if(!token){ openInfo(t('settings.calendarSync'), '<p style="font-size:13px;color:var(--late);padding:20px 2px;text-align:center">'+t('toast.genericError')+'</p>'); return; }
    const url = urlFeedCalendario(token);
    const icsUrl = urlFeedCalendario(token)+'&format=ics';
    const webcalUrl = url.replace(/^https?:\/\//,'webcal://');
    const googleUrl = 'https://calendar.google.com/calendar/r?cid='+encodeURIComponent(url);
    openInfo(t('settings.calendarSync'), `
      <p style="font-size:13px;color:var(--ink-soft);margin-bottom:14px;line-height:1.5">${t('sync.explain')}</p>
      <div class="field u-mb-10"><label>${t('sync.linkLabel')}</label><input readonly value="${escapeHtml(url)}" onclick="this.select()"></div>
      <div class="u-flex-g8">
        <button class="btn soft u-flex-1" onclick="navigator.clipboard.writeText('${escapeHtml(url)}');showToast(t('toast.linkCopied'))">${t('action.copyLink')}</button>
        <a href="${escapeHtml(icsUrl)}" download="pivot-calendar.ics" class="btn soft" style="flex:1;display:flex;align-items:center;justify-content:center;text-decoration:none;gap:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>${t('sync.downloadIcs')}</a>
      </div>
      <p class="plabel u-m-18-2-8">${t('sync.howToTitle')}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <a href="${escapeHtml(googleUrl)}" target="_blank" rel="noopener" class="btn soft u-row-link-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Google Calendar
        </a>
        <a href="${escapeHtml(webcalUrl)}" class="btn soft u-row-link-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Apple Calendar
        </a>
      </div>
      <p style="font-size:11.5px;color:var(--ink-faint);line-height:1.55;margin:0 2px">
        <b>Google:</b> ${t('sync.howToGoogle')}<br>
        <b>Apple:</b> ${t('sync.howToApple')}<br>
        <b>${t('sync.other')}:</b> ${t('sync.howToOther')}
      </p>
    `);
  }
  /* Lembretes automáticos de pendência do cliente (pagamento, revisão,
     assinatura de contrato etc.) — sempre por email. Dois momentos
     configuráveis, valores temporários enquanto o sheet está aberto:
     Aviso = dias de antecedência até a deadline (0 = no mesmo dia);
     Atraso = dias depois da deadline pra reenviar, caso ainda pendente.
     Padrão: aviso no dia (0), atraso 3 dias depois. */
  let notifLembreteAvisoTemp=0, notifLembreteAtrasoTemp=3;
  function alterarLembreteAviso(delta){
    notifLembreteAvisoTemp=Math.max(0, Math.min(30, notifLembreteAvisoTemp+delta));
    atualizarLembretesNotifUI();
  }
  function alterarLembreteAtraso(delta){
    notifLembreteAtrasoTemp=Math.max(1, Math.min(30, notifLembreteAtrasoTemp+delta));
    atualizarLembretesNotifUI();
  }
  function atualizarLembretesNotifUI(){
    const avisoEl=document.getElementById('notif-aviso-dias'); if(avisoEl) avisoEl.textContent=notifLembreteAvisoTemp;
    const atrasoEl=document.getElementById('notif-atraso-dias'); if(atrasoEl) atrasoEl.textContent=notifLembreteAtrasoTemp;
    const avisoSub=document.getElementById('notif-aviso-sub');
    if(avisoSub) avisoSub.textContent = notifLembreteAvisoTemp===0 ? t('notif.reminderWarningSameDay')
      : notifLembreteAvisoTemp===1 ? t('notif.reminderWarningDayBefore')
      : t('notif.reminderWarningDaysBefore').replace('{n}', notifLembreteAvisoTemp);
    const atrasoSub=document.getElementById('notif-atraso-sub');
    if(atrasoSub) atrasoSub.textContent = notifLembreteAtrasoTemp===1 ? t('notif.reminderLateDayAfter')
      : t('notif.reminderLateDaysAfter').replace('{n}', notifLembreteAtrasoTemp);
  }
  function infoNotificacoes(){
    notifLembreteAvisoTemp = perfilData.lembreteAvisoDias!=null ? perfilData.lembreteAvisoDias : 0;
    notifLembreteAtrasoTemp = perfilData.lembreteAtrasoDias!=null ? perfilData.lembreteAtrasoDias : 3;
    openInfo(t('profile.notifications'), `
      <div class="struct-row u-p-12-2"><div class="nm">${t('notif.email')}</div><div class="toggle${perfilData.notifEmail?' on':''}" onclick="this.classList.toggle('on')" id="notif-email"><div class="kn"></div></div></div>
      <div class="struct-row u-p-12-2"><div class="nm">${t('notif.inApp')}</div><div class="toggle${perfilData.notifApp?' on':''}" onclick="this.classList.toggle('on')" id="notif-app"><div class="kn"></div></div></div>
      <p class="plabel" style="margin:20px 2px 4px">${t('notif.remindersTitle')}</p>
      <p style="font-size:12px;color:var(--ink-soft);margin:0 2px 10px">${t('notif.remindersHint')}</p>
      <div class="struct-row u-p-12-2">
        <div class="struct-l"><div class="nm">${t('notif.reminderWarning')}</div><span class="sub" id="notif-aviso-sub"></span></div>
        <div class="u-row">
          <button type="button" class="btn soft u-sq-28" onclick="alterarLembreteAviso(-1)">−</button>
          <span class="u-badge-min" id="notif-aviso-dias"></span>
          <button type="button" class="btn soft u-sq-28" onclick="alterarLembreteAviso(1)">+</button>
        </div>
      </div>
      <div class="struct-row u-p-12-2">
        <div class="struct-l"><div class="nm">${t('notif.reminderLate')}</div><span class="sub" id="notif-atraso-sub"></span></div>
        <div class="u-row">
          <button type="button" class="btn soft u-sq-28" onclick="alterarLembreteAtraso(-1)">−</button>
          <span class="u-badge-min" id="notif-atraso-dias"></span>
          <button type="button" class="btn soft u-sq-28" onclick="alterarLembreteAtraso(1)">+</button>
        </div>
      </div>
      <button class="btn primary u-w-full u-mt-12" onclick="guardarNotificacoes()">${t('action.save')}</button>`);
    atualizarLembretesNotifUI();
  }
  function guardarNotificacoes(){
    perfilData.notifEmail=document.getElementById('notif-email').classList.contains('on');
    perfilData.notifApp=document.getElementById('notif-app').classList.contains('on');
    perfilData.lembreteAvisoDias=notifLembreteAvisoTemp;
    perfilData.lembreteAtrasoDias=notifLembreteAtrasoTemp;
    savePerfilData();
    closeInfo(); showToast(t('toast.settingsSaved'));
  }
  function infoSobre(){
    openInfo(t('profile.about'), `
      <div class="struct-row u-p-12-2"><div class="nm">${t('about.version')}</div><div class="v">${PIVOT_VERSAO||'1.0.0'}</div></div>
      <div class="prow" onclick="abrirPoliticaPrivacidade()"><div class="t">${t('about.privacyPolicy')}</div><svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
      <div class="prow" onclick="abrirTermosDeUso()"><div class="t">${t('about.termsOfUse')}</div><svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>`);
  }
  function infoPrivacidade(){
    openInfo(t('modal.privacy'), `
      <p class="u-hint">${t('privacy.desc')}</p>
      <div class="prow u-mb-9" onclick="abrirPoliticaPrivacidade()"><div class="t">${t('about.privacyPolicy')}</div><svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
      <button class="btn soft u-w-full u-mb-9" onclick="exportarDadosReal()">${t('action.exportData')}</button>
      <button class="btn soft" style="width:100%;color:var(--ink);border-color:var(--late)" onclick="confirmarApagarDados()">${t('action.deleteAccount')}</button>`);
  }
  /* ===== Termos de Uso / Política de Privacidade — texto completo dentro da
     app (nada de abrir ficheiro externo numa nova aba). Mesmo conteúdo de
     termos.html/privacidade.html (mantidos na raiz por compatibilidade com
     quem já tinha o link direto), só reformatado com a tipografia padrão
     dos modais (openInfo). Sem tradução própria (PT) — mesma decisão que já
     valia pros ficheiros estáticos que substituem. */
  function legalSecaoHtml(titulo, paragrafos){
    return '<p class="plabel u-m-18-2-8">'+titulo+'</p>'+
      paragrafos.map(p=>'<p class="u-label-soft u-lh-16 u-m-010">'+p+'</p>').join('');
  }
  function abrirPoliticaPrivacidade(){
    const html='<p class="u-xxs-faint">Última atualização: 29 de julho de 2026</p>'+
      '<p class="u-label-soft u-lh-16 u-m-010">Esta política explica que dados o Pivots recolhe, para que servem, com quem podem ser partilhados, por quanto tempo são guardados e quais são os seus direitos sobre eles. Ao usar o Pivots, você concorda com o que está descrito aqui.</p>'+
      legalSecaoHtml('1. Quem somos e a que se aplica esta política', ['O Pivots é uma aplicação de gestão de trabalhos, clientes, contratos e finanças para profissionais independentes e pequenas equipas. Esta política aplica-se a si (o profissional que usa o Pivots) e, na parte relevante, aos seus clientes que acedem ao Portal do Cliente ou assinam um contrato através da aplicação.'])+
      legalSecaoHtml('2. Dados que recolhemos', [
        '<b>Fornecidos diretamente:</b> dados de conta (nome, email, palavra-passe encriptada, telefone, dados da empresa); dados que insere sobre a sua atividade (trabalhos, clientes, contratos, cláusulas, pagamentos, despesas, orçamentos, modelos, serviços); a sua assinatura e a dos seus clientes ao assinarem um contrato; comunicações com o suporte.',
        '<b>Recolhidos automaticamente:</b> dados técnicos de sessão e preferências, e registos de utilização necessários ao funcionamento e diagnóstico do serviço.',
        '<b>De terceiros que você liga:</b> ao ativar uma integração (ex.: sincronização de calendário), só os dados estritamente necessários a essa integração são partilhados, e só enquanto a ligação estiver ativa.'
      ])+
      legalSecaoHtml('3. Como usamos os dados', ['Para disponibilizar as funcionalidades da aplicação, enviar notificações e lembretes por email relacionados com os seus trabalhos, processar a sua subscrição, manter a segurança do serviço e cumprir obrigações legais. Não usamos os seus dados para treinar modelos de terceiros nem para publicidade direcionada.'])+
      legalSecaoHtml('4. Base legal do tratamento', ['Tratamos os seus dados com base na execução do contrato de subscrição consigo, no seu consentimento explícito quando aplicável, no cumprimento de obrigações legais e no nosso interesse legítimo em manter o serviço seguro e funcional.'])+
      legalSecaoHtml('5. Partilha com terceiros', ['Não vendemos nem alugamos os seus dados. Partilhamos apenas com serviços que você autoriza explicitamente, com fornecedores de infraestrutura necessários ao funcionamento do serviço (hospedagem, base de dados, pagamentos, envio de email — só com o acesso estritamente necessário), por obrigação legal, ou numa eventual venda/fusão do negócio, sempre sujeitos aos mesmos compromissos de proteção descritos aqui.'])+
      legalSecaoHtml('6. Retenção de dados', ['Guardamos os seus dados enquanto a conta estiver ativa. Ao eliminar a conta, os dados são apagados permanentemente, exceto quando a lei exigir retenção mais longa (ex.: registos fiscais).'])+
      legalSecaoHtml('7. Os seus direitos', ['Sujeito à legislação aplicável (incluindo RGPD, se residir na UE), tem direito a aceder, corrigir, exportar e eliminar os seus dados, e a retirar consentimentos dados anteriormente. Pode exercer estes direitos em Perfil → Conta / Privacidade, ou contactando-nos.'])+
      legalSecaoHtml('8. Segurança', ['Palavras-passe encriptadas, ligações cifradas (HTTPS/TLS) e controlo de acesso por conta/equipa. Tokens de acesso a serviços de terceiros só são acedidos pelo backend, nunca ficam expostos no dispositivo. Nenhum sistema é totalmente imune a falhas — em caso de incidente que afete os seus dados, será notificado nos termos exigidos por lei.'])+
      legalSecaoHtml('9. Menores de idade', ['O Pivots não se destina a menores de 18 anos. Não recolhemos intencionalmente dados de menores.'])+
      legalSecaoHtml('10. Transferências internacionais', ['Os seus dados podem ser processados em servidores fora do seu país de residência, sempre com fornecedores que aplicam salvaguardas adequadas de proteção de dados.'])+
      legalSecaoHtml('11. Alterações a esta política', ['Podemos atualizar esta política ocasionalmente. Alterações relevantes serão comunicadas dentro da aplicação antes de entrarem em vigor.'])+
      legalSecaoHtml('12. Contacto', ['Dúvidas sobre esta política ou sobre os seus dados: <a href="mailto:support@pivots.app">support@pivots.app</a>']);
    openInfo(t('about.privacyPolicy'), html, infoSobre);
  }
  function abrirTermosDeUso(){
    const html='<p class="u-xxs-faint">Última atualização: 29 de julho de 2026</p>'+
      '<p class="u-label-soft u-lh-16 u-m-010">Estes Termos de Uso ("Termos") regem o acesso e uso do Pivots, uma aplicação de gestão de trabalhos, clientes, contratos e finanças para profissionais independentes ("o Serviço"). Ao criar uma conta ou usar o Pivots, você concorda com estes Termos.</p>'+
      legalSecaoHtml('1. Elegibilidade e conta', ['Para usar o Pivots você deve ter pelo menos 18 anos e capacidade legal para celebrar contratos. É responsável por manter a confidencialidade das suas credenciais, por toda a atividade na sua conta e pela exatidão dos dados que insere. Notifique-nos imediatamente se suspeitar de acesso não autorizado.'])+
      legalSecaoHtml('2. Uso do serviço', ['O Pivots destina-se à gestão da sua atividade profissional. Você concorda em não usar o Serviço para fins ilegais ou fraudulentos, para prejudicar ou assediar terceiros, para tentar aceder sem autorização a sistemas de outros utilizadores, ou para revender o Serviço sem autorização prévia por escrito.'])+
      legalSecaoHtml('3. Subscrição, cobrança e cancelamento', ['O Pivots oferece um plano gratuito e planos pagos. Ao subscrever um plano pago, autoriza a cobrança periódica através do método indicado. Pode cancelar a qualquer momento em Perfil → Plano; o cancelamento produz efeito no fim do período já pago, sem reembolso proporcional salvo quando exigido por lei. Alterações de preço são avisadas com antecedência razoável.'])+
      legalSecaoHtml('4. Contratos gerados através do Pivots', ['Os modelos e o construtor de cláusulas são ferramentas de apoio — você é o único responsável pelo conteúdo e adequação legal dos contratos que cria e envia. O Pivots não presta aconselhamento jurídico. A validade legal da assinatura eletrónica recolhida pode variar consoante a jurisdição aplicável ao contrato.'])+
      legalSecaoHtml('5. Integrações de terceiros', ['Integrações como o Google Calendar exigem a sua autorização explícita e estão sujeitas também aos termos do respetivo serviço. Pode desligar qualquer integração a qualquer momento.'])+
      legalSecaoHtml('6. Propriedade dos dados e conteúdo', ['Os dados que insere pertencem a você — concede-nos apenas a licença necessária para os armazenar, processar e exibir de volta a si (e aos seus clientes, via Portal do Cliente) como parte do Serviço. Pode exportar os seus dados ou eliminar a conta a qualquer momento. O software, marca e design do Pivots são propriedade nossa ou dos nossos licenciadores.'])+
      legalSecaoHtml('7. Disponibilidade do serviço', ['Não garantimos disponibilidade ininterrupta. Podem ocorrer manutenções, indisponibilidade técnica ou alterações a funcionalidades — recomendamos manter cópias de segurança via exportação.'])+
      legalSecaoHtml('8. Limitação de responsabilidade', ['Na máxima medida permitida por lei, o Serviço é fornecido "tal como está". Não somos responsáveis por danos indiretos, incidentais ou consequenciais, incluindo perda de dados, perda de receita ou disputas entre você e os seus clientes decorrentes de contratos geridos na plataforma.'])+
      legalSecaoHtml('9. Suspensão e encerramento', ['Podemos suspender ou encerrar o acesso em caso de violação destes Termos, uso fraudulento ou não pagamento em atraso, com aviso quando razoavelmente possível. Pode encerrar a sua conta a qualquer momento.'])+
      legalSecaoHtml('10. Alterações a estes Termos', ['Alterações relevantes serão comunicadas dentro da aplicação antes de entrarem em vigor; o uso continuado após essa comunicação constitui aceitação dos novos Termos.'])+
      legalSecaoHtml('11. Lei aplicável', ['Estes Termos são regidos pela lei portuguesa, sem prejuízo de direitos imperativos que lhe assistam ao abrigo da lei do seu país de residência, caso aplicável.'])+
      legalSecaoHtml('12. Contacto', ['Dúvidas sobre estes termos: <a href="mailto:support@pivots.app">support@pivots.app</a>']);
    openInfo(t('about.termsOfUse'), html, infoSobre);
  }
  function exportarDadosReal(){
    const pacote={ exportadoEm:new Date().toISOString(), conta:perfilData, trabalhos:jobsData, clientes:clientesData, tarefas:tarefasData, lembretes:lembretesData, listas:listasData, custos:custosData, referencias:referenciasData };
    const blob=new Blob([JSON.stringify(pacote,null,2)], {type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='pivot-dados-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    closeInfo();
    showToast(t('toast.fileDownloaded'));
  }
  /* Eliminação de conta — antes disto, esta função só mostrava um toast e
     não apagava nada de facto (a promessa da Política de Privacidade não
     era cumprida pelo código). Agora chama /api/account/delete, que apaga
     mesmo os dados: se o utilizador for Admin, apaga o workspace inteiro
     e todos perdem acesso — por isso o aviso é diferente consoante o
     papel, para ninguém confirmar sem perceber o alcance real. */
  async function confirmarApagarDados(){
    const aviso = souAdmin() ? t('privacy.deleteConfirmAdmin') : t('privacy.deleteConfirm');
    if(!confirm(aviso)) return;
    if(!confirm(t('privacy.deleteConfirmFinal'))) return;
    showToast(t('toast.deletingAccount'));
    try{
      const { data:sessionData } = await sb.auth.getSession();
      const access_token = sessionData && sessionData.session && sessionData.session.access_token;
      const res = await fetch('/api/account/delete', { method:'POST', headers:{'Authorization':'Bearer '+access_token} });
      const body = await res.json().catch(()=>({}));
      if(!res.ok){ showToast(body.error||t('toast.genericError')); return; }
      await sb.auth.signOut();
      window.location.reload();
    }catch(e){ showToast(t('toast.genericError')); }
  }
  /* Ajuda — 5 destinos fixos (Primeiros passos, Central de ajuda, Tutoriais,
     FAQ, Falar com o suporte) em vez dos 3 acordeões soltos de antes. Cada
     um abre a sua própria tela; "Falar com o suporte" abre diretamente o
     cliente de email do utilizador com o endereço oficial do Pivots. */
  function infoAjuda(){
    const chevr='<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 18 6-6-6-6"/></svg>';
    const linha=(fn,icone,rotulo)=>'<div class="prow" onclick="'+fn+'">'+iconMask(icone)+'<div class="t">'+rotulo+'</div>'+chevr+'</div>';
    openInfo(t('modal.help'),
      '<div class="plist">'+
        linha('infoPrimeirosPassos()','https://api.iconify.design/material-symbols:rocket-launch-outline.svg',t('help.gettingStarted'))+
        linha('infoCentralAjuda()','https://api.iconify.design/mdi:help-circle.svg',t('help.helpCenter'))+
        linha('infoTutoriais()','https://api.iconify.design/material-symbols:play-circle-outline.svg',t('help.tutorials'))+
        linha('infoFaq()','https://api.iconify.design/material-symbols:quiz-outline.svg',t('help.faq'))+
        linha('abrirSuporteEmail()','https://api.iconify.design/material-symbols:mail-outline.svg',t('action.contactSupport'))+
      '</div>');
  }
  /* bloco reutilizado pelas subtelas de Ajuda: acordeão de pergunta/resposta,
     com botão de voltar para a lista principal. */
  function ajudaSubtela(titulo, pares){
    const html=pares.map(([q,a])=>
      '<div class="collapse"><div class="collapse-head" onclick="this.parentElement.classList.toggle(\'open\')">'+
        '<div class="collapse-l">'+q+'</div>'+
        '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>'+
      '</div><div class="collapse-body"><p style="font-size:13px;color:var(--ink-soft);line-height:1.55">'+a+'</p></div></div>'
    ).join('');
    openInfo(titulo, html, infoAjuda);
  }
  function infoPrimeirosPassos(){
    ajudaSubtela(t('help.gettingStarted'), [
      [t('help.step1Title'), t('help.step1Desc')],
      [t('help.step2Title'), t('help.step2Desc')],
      [t('help.step3Title'), t('help.step3Desc')],
    ]);
  }
  function infoCentralAjuda(){
    ajudaSubtela(t('help.helpCenter'), [
      [t('help.todayTitle'), t('help.todayDesc')],
      [t('help.portalTitle'), t('help.portalDesc')],
      [t('help.templateTitle'), t('help.templateDesc')],
    ]);
  }
  function infoTutoriais(){
    ajudaSubtela(t('help.tutorials'), [
      [t('help.tut1Title'), t('help.tut1Desc')],
      [t('help.tut2Title'), t('help.tut2Desc')],
      [t('help.tut3Title'), t('help.tut3Desc')],
    ]);
  }
  function infoFaq(){
    ajudaSubtela(t('help.faq'), [
      [t('help.faq1Title'), t('help.faq1Desc')],
      [t('help.faq2Title'), t('help.faq2Desc')],
      [t('help.faq3Title'), t('help.faq3Desc')],
    ]);
  }
  function abrirSuporteEmail(){
    const a=document.createElement('a');
    a.href='mailto:support@pivots.app?subject='+encodeURIComponent('Preciso de ajuda com o Pivots');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    closeInfo();
    showToast(t('toast.openingEmail'));
  }
