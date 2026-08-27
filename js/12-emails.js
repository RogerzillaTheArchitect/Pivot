/* Pivots — emails
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  function marcarContratoAlterado(job){
    const d=new Date();
    job.contract.lastModified=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  }
  async function gerarLinkContrato(jobId, prazoISO, metodosSelecionados){
    const job=jobsData[jobId];
    const token=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36)).replace(/-/g,'').slice(0,20);
    const row={ token, workspace_id: currentWorkspaceId, job_id: jobId };
    if(prazoISO) row.expires_at = prazoISO+'T23:59:59';
    const { error } = await sb.from('portal_tokens').insert(row);
    if(error){ console.error(error); showToast('Erro ao gerar link. Tenta novamente.'); return; }
    job.contract.link = window.location.origin + '/?portal=' + token;
    job.contract.codigoAcesso = gerarCodigoAcessoPortal();
    job.contract.status='enviado';
    job.contract.enviadoEm = new Date().toLocaleDateString(jsLocale(), {day:'2-digit',month:'2-digit',year:'numeric'});
    job.paymentMethods = metodosSelecionados || [];
    pushHistory(job,t('toast.contractGenerated'));
    saveJobsData(); updateJobCard(jobId);
    showToast(t('toast.linkGenerated'));
    const prazoTexto = prazoISO ? new Date(prazoISO+'T00:00:00').toLocaleDateString('pt-PT') : null;
    dispararEmailEvento(job.structure.briefing?'briefingDisponivel':'contratoEnviado', job.email, job, prazoTexto);
  }
  function abrirDefinirPrazoPortal(id){
    const daqui14=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
    const mp=perfilData.metodosPagamento;
    const metodosHtml=METODOS_PAGAMENTO_META.filter(([key])=>mp[key].ativo).map(([key,labelKey])=>
      '<div class="struct-row"><div class="struct-l"><div class="nm">'+t(labelKey)+'</div></div><div class="toggle'+(mp[key].padrao?' on':'')+'" id="pp-metodo-'+key+'" onclick="this.classList.toggle(\'on\')"><div class="kn"></div></div></div>'
    ).join('');
    openInfo('Prazo para o cliente', `
      <p class="u-hint">Define até quando o cliente pode assinar o contrato e preencher o briefing. Depois deste prazo, o link deixa de funcionar.</p>
      <div class="field"><label>Disponível até</label><input type="date" id="pp-prazo-input" value="${daqui14}"></div>
      ${metodosHtml ? ('<p class="plabel u-m-14-2-9">'+t('payment.method.selectTitle')+'</p>'+metodosHtml) : ''}
      <button class="btn dark u-w-full u-mt-14" onclick="confirmarPrazoEGerarLink('${id}')">Gerar link</button>`);
  }
  function confirmarPrazoEGerarLink(id){
    const prazo=document.getElementById('pp-prazo-input').value;
    const mp=perfilData.metodosPagamento;
    const metodos=METODOS_PAGAMENTO_META.filter(([key])=>{
      const el=document.getElementById('pp-metodo-'+key);
      return el && el.classList.contains('on');
    }).map(([key,labelKey])=>({tipo:key, label:t(labelKey), valor:mp[key].valor}));
    closeInfo();
    gerarLinkContrato(id, prazo||null, metodos).then(()=>{
      if(document.getElementById('v-detalhe').classList.contains('active')) renderJobDetailDynamic(id);
      abrirCompartilharPortal(id);
    });
  }
  /* ===== Sistema visual partilhado por TODOS os emails do Pivots =====
     Logo isolado no topo + cartão com cabeçalho verde (bloco branco com a
     logo do Pivots — sempre a mesma, nunca a do remetente) + avatar de quem
     despoletou a ação a sobrepor a fronteira, quando aplicável + grelha de
     funcionalidades opcional + botão em pílula + rodapé com aviso legal. */
  const EMAIL_LOGO_URL="https://pivots.app/email/logo-square.png";
  const EMAIL_ASSET_BASE="https://pivots.app/email";
  const EMAIL_PAGE="#F5F3EE", EMAIL_CARD="#FFFFFF", EMAIL_FOOT="#F8F6F1",
    EMAIL_HEADBG="#0A2F1D", EMAIL_CTA="#15532D", EMAIL_ALERTA="#B23A2E",
    EMAIL_TINTA="#0E1D16", EMAIL_CINZA="#6B6459", EMAIL_LINHA="#E7E2D6", EMAIL_LINHA_SUAVE="#ECE8DF",
    EMAIL_EYEBROW="#BFD8C6", EMAIL_CHIP="#FBFAF6", EMAIL_VERDE_CLARO="#EAF3EC";
  // Só estas duas fontes (Cal Sans nos títulos — único peso disponível no
  // Google Fonts, já é um display font "pesado" por desenho — e Lexend Deca
  // em tudo o resto). @font-face embutido em cada email; clientes sem suporte
  // caem no fallback do sistema.
  const EMAIL_FONT_DISPLAY="'Cal Sans','Helvetica Neue',Helvetica,Arial,sans-serif";
  const EMAIL_FONT="'Lexend Deca','Helvetica Neue',Helvetica,Arial,sans-serif";
  const EMAIL_FONT_FACES='<style>'+
    "@font-face{font-family:'Cal Sans';font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/calsans/v2/fdN99sWUv3gWqXxqqSBb.ttf) format('truetype');}"+
    "@font-face{font-family:'Lexend Deca';font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/lexenddeca/v25/K2FifZFYk-dHSE0UPPuwQ7CrD94i-NCKm-U48M1ArA.ttf) format('truetype');}"+
    "@font-face{font-family:'Lexend Deca';font-style:normal;font-weight:600;font-display:swap;src:url(https://fonts.gstatic.com/s/lexenddeca/v25/K2FifZFYk-dHSE0UPPuwQ7CrD94i-NCKm-U4LspArA.ttf) format('truetype');}"+
    "@font-face{font-family:'Lexend Deca';font-style:normal;font-weight:700;font-display:swap;src:url(https://fonts.gstatic.com/s/lexenddeca/v25/K2FifZFYk-dHSE0UPPuwQ7CrD94i-NCKm-U4F8pArA.ttf) format('truetype');}"+
    '</style>';
  // Trava o email em modo claro sempre — sem isso, Outlook.com/Edge Mail e o
  // Gmail app aplicam dark mode automático que reescreve fundo/texto sozinhos,
  // apagando o traço dos ícones (PNG com fundo transparente). meta color-scheme
  // cobre clientes modernos; [data-ogsc]/[data-ogsb] cobrem Outlook.com/Windows
  // Mail, que ignoram a meta tag e só respeitam atributo injetado no dark mode.
  function emailDarkModeLockHtml(){
    return '<meta name="color-scheme" content="light only">'+
      '<meta name="supported-color-schemes" content="light only">'+
      '<style>:root{color-scheme:light only;supported-color-schemes:light only}'+
      '[data-ogsc] .pv-bg-page,[data-ogsb] .pv-bg-page{background:'+EMAIL_PAGE+' !important}'+
      '[data-ogsc] .pv-bg-card,[data-ogsb] .pv-bg-card{background:'+EMAIL_CARD+' !important}'+
      '[data-ogsc] .pv-bg-head,[data-ogsb] .pv-bg-head{background:'+EMAIL_HEADBG+' !important}'+
      '[data-ogsc] .pv-bg-foot,[data-ogsb] .pv-bg-foot{background:'+EMAIL_FOOT+' !important}'+
      '[data-ogsc] .pv-bg-chip,[data-ogsb] .pv-bg-chip{background:'+EMAIL_CHIP+' !important}'+
      '[data-ogsc] .pv-bg-tint,[data-ogsb] .pv-bg-tint{background:'+EMAIL_VERDE_CLARO+' !important}'+
      '[data-ogsc] .pv-bg-cta,[data-ogsb] .pv-bg-cta{background:'+EMAIL_CTA+' !important}'+
      '[data-ogsc] .pv-line,[data-ogsb] .pv-line{border-color:'+EMAIL_LINHA_SUAVE+' !important}'+
      '[data-ogsc] .pv-ink,[data-ogsb] .pv-ink{color:'+EMAIL_TINTA+' !important}'+
      '[data-ogsc] .pv-soft,[data-ogsb] .pv-soft{color:'+EMAIL_CINZA+' !important}'+
      '[data-ogsc] .pv-white,[data-ogsb] .pv-white{color:#ffffff !important}'+
      '</style>';
  }
  // Envolve o fragmento (uma <table> só) num documento HTML completo com
  // <head> — nada mais faz isso antes de mandar para o Resend, e sem <head>
  // as metas de modo claro e os @font-face não são respeitados de forma fiável.
  function emailDocWrap(innerHtml){
    return '<!doctype html><html><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      emailDarkModeLockHtml()+EMAIL_FONT_FACES+
      '</head><body style="margin:0;padding:0">'+innerHtml+'</body></html>';
  }
  const EMAIL_ICON_FILE={team:'sm-people', folder:'sm-folder', bell:'sm-bell'};
  function emailFeatureCellHtml(icone, titulo, desc){
    const arquivo = EMAIL_ICON_FILE[icone]||icone;
    return '<td width="33%" style="padding:0 6px;text-align:center;vertical-align:top">'+
      '<table role="presentation" width="100%"><tr><td style="text-align:center;padding-bottom:8px">'+
      '<div bgcolor="'+EMAIL_VERDE_CLARO+'" class="pv-bg-tint" style="width:46px;height:46px;border-radius:50%;background:'+EMAIL_VERDE_CLARO+';margin:0 auto;line-height:46px;text-align:center">'+
        '<img src="'+EMAIL_ASSET_BASE+'/'+arquivo+'.png" width="20" height="20" style="vertical-align:middle;display:inline-block" alt="">'+
      '</div></td></tr>'+
      '<tr><td class="pv-ink" style="text-align:center;font-family:'+EMAIL_FONT+';font-size:11.5px;font-weight:700;color:'+EMAIL_TINTA+';padding-bottom:3px">'+escapeHtml(titulo)+'</td></tr>'+
      '<tr><td class="pv-soft" style="text-align:center;font-family:'+EMAIL_FONT+';font-size:10px;color:'+EMAIL_CINZA+';line-height:1.4">'+escapeHtml(desc)+'</td></tr>'+
      '</table></td>';
  }
  /* opts: alerta, headerLabel (texto no canto do cabeçalho verde, ex.: "Ação
     necessária"), heroIcon (nome do ficheiro em /email, ex.: "hero-folder" —
     ignorado se houver avatar), eyebrow (nome de quem despoletou a ação,
     mostrado por cima do título quando há avatar), heading, body,
     avatarLetras, avatarCor, avatarFoto (URL http real; tem prioridade sobre
     avatarLetras), features:[{icon,titulo,desc}], detalhes:[[label,valor]],
     codigo, ctaText, ctaUrl, hint, footerNote */
  function emailShellHtml(opts){
    opts=opts||{};
    const cor = opts.alerta ? EMAIL_ALERTA : EMAIL_CTA;
    const temAvatar = !!(opts.avatarLetras||opts.avatarFoto);
    // Mostra a foto real de quem despoletou a ação quando existir (opts.avatarFoto
    // = URL http, nunca data URI — Gmail bloqueia data URI em email); só cai
    // para o círculo de iniciais quando não há foto guardada no perfil.
    const avatarCirculo = opts.avatarFoto
      ? '<img src="'+opts.avatarFoto+'" width="68" height="68" alt="" style="width:68px;height:68px;border-radius:50%;object-fit:cover;display:inline-block;border:4px solid #fff">'
      : '<td style="width:68px;height:68px;border-radius:50%;background:'+(opts.avatarCor||EMAIL_TINTA)+';border:4px solid #fff;text-align:center;vertical-align:middle;font-family:'+EMAIL_FONT+';font-size:22px;font-weight:700;color:#fff">'+escapeHtml(opts.avatarLetras||'')+'</td>';
    const avatarBlock = temAvatar ? (
      '<tr><td bgcolor="'+cor+'" class="pv-bg-head" style="background:'+cor+';padding:0;text-align:center;line-height:0;font-size:0">'+
        (opts.avatarFoto
          ? '<table class="u-m-auto-n34" role="presentation" align="center"><tr><td>'+avatarCirculo+'</td></tr></table>'
          : '<table class="u-m-auto-n34" role="presentation" align="center"><tr>'+avatarCirculo+'</tr></table>')+
      '</td></tr>'
    ) : '';
    const heroHtml = (!temAvatar && opts.heroIcon)
      ? '<tr><td align="center" style="padding:6px 0 26px"><img src="'+EMAIL_ASSET_BASE+'/'+opts.heroIcon+'.png" width="96" height="96" alt="" style="display:block;margin:0 auto;border:0"></td></tr>' : '';
    const eyebrowHtml = opts.eyebrow
      ? '<div class="pv-ink" style="font-size:13px;font-weight:700;color:'+cor+';margin:0 0 6px;font-family:'+EMAIL_FONT+'">'+escapeHtml(opts.eyebrow)+'</div>' : '';
    const featuresHtml = (opts.features && opts.features.length)
      ? '<tr><td style="padding:2px 0 6px"><table role="presentation" width="100%"><tr>'+
          opts.features.map(f=>emailFeatureCellHtml(f.icon, f.titulo, f.desc)).join('')+
        '</tr></table></td></tr>' : '';
    const detalhesHtml = (opts.detalhes && opts.detalhes.length)
      ? '<tr><td style="padding:0 0 20px"><table role="presentation" width="100%" bgcolor="'+EMAIL_CHIP+'" class="pv-bg-chip pv-line" style="background:'+EMAIL_CHIP+';border:1px solid '+EMAIL_LINHA+';border-radius:12px"><tr><td style="padding:14px 16px;font-family:'+EMAIL_FONT+'">'+
        opts.detalhes.map(d=>'<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0"><span class="pv-soft" style="color:'+EMAIL_CINZA+'">'+escapeHtml(d[0])+'</span><span class="pv-ink" style="color:'+EMAIL_TINTA+';font-weight:700">'+escapeHtml(d[1])+'</span></div>').join('')+
        '</td></tr></table></td></tr>' : '';
    const codigoHtml = opts.codigo
      ? '<tr><td style="padding:4px 0 20px;text-align:center"><div bgcolor="'+EMAIL_CHIP+'" class="pv-bg-chip pv-line pv-ink" style="display:inline-block;background:'+EMAIL_CHIP+';border:1px solid '+EMAIL_LINHA+';border-radius:12px;padding:16px 28px;font-family:'+EMAIL_FONT+';font-size:26px;font-weight:700;letter-spacing:.26em;color:'+EMAIL_TINTA+'">'+escapeHtml(String(opts.codigo))+'</div></td></tr>' : '';
    const ctaHtml = opts.ctaText
      ? '<tr><td style="padding:2px 0 '+((opts.hint||opts.footerNote)?'14px':'2px')+'"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="'+cor+'" class="pv-bg-cta" style="border-radius:11px"><a href="'+escapeHtml(opts.ctaUrl||'#')+'" class="pv-white" style="display:block;padding:16px 24px;font-family:'+EMAIL_FONT+';font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:11px">'+escapeHtml(opts.ctaText)+'</a></td></tr></table></td></tr>' : '';
    const hintHtml = opts.hint
      ? '<tr><td align="center" class="pv-soft" style="font-family:'+EMAIL_FONT+';font-size:12.5px;color:'+EMAIL_CINZA+';padding:0 0 2px">'+escapeHtml(opts.hint)+'</td></tr>' : '';
    const footerNoteHtml = opts.footerNote
      ? '<tr><td align="center" class="pv-soft" style="padding:14px 4px 0;font-family:'+EMAIL_FONT+';font-size:12px;color:'+EMAIL_CINZA+';line-height:1.6">'+opts.footerNote+'</td></tr>' : '';
    const inner = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="'+EMAIL_PAGE+'" class="pv-bg-page" style="background:'+EMAIL_PAGE+'">'+
      '<tr><td align="center" style="padding:30px 12px">'+
        '<table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" bgcolor="'+EMAIL_CARD+'" class="pv-bg-card" style="width:480px;max-width:480px;background:'+EMAIL_CARD+';border:1px solid '+EMAIL_LINHA_SUAVE+';border-radius:18px;overflow:hidden">'+
          '<tr><td bgcolor="'+cor+'" class="pv-bg-head" style="background:'+cor+';padding:22px 26px">'+
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'+
              '<td align="left" valign="middle" width="40"><img src="'+EMAIL_LOGO_URL+'" width="34" height="34" alt="Pivots" style="display:block;border-radius:8px"></td>'+
              '<td align="right" valign="middle" style="font-family:'+EMAIL_FONT+';font-size:13px;color:'+EMAIL_EYEBROW+';font-weight:600">'+escapeHtml(opts.headerLabel||'')+'</td>'+
            '</tr></table>'+
          '</td></tr>'+
          (opts.extraTop||'')+
          avatarBlock+
          '<tr><td bgcolor="'+EMAIL_CARD+'" class="pv-bg-card" style="padding:'+(temAvatar?'34px 34px 4px':'40px 34px 4px')+'" align="center">'+
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'+
              heroHtml+
              '<tr><td align="center">'+eyebrowHtml+'</td></tr>'+
              '<tr><td align="center" class="pv-ink" style="font-family:'+EMAIL_FONT_DISPLAY+';font-size:24px;line-height:1.28;font-weight:400;letter-spacing:-.01em;color:'+EMAIL_TINTA+';padding:0 0 12px">'+opts.heading+'</td></tr>'+
              (opts.body ? '<tr><td align="center" class="pv-soft" style="font-family:'+EMAIL_FONT+';font-size:14px;line-height:1.6;color:'+EMAIL_CINZA+';padding:0 0 22px">'+opts.body+'</td></tr>' : '')+
              featuresHtml+ detalhesHtml+ codigoHtml+ ctaHtml+ hintHtml+ footerNoteHtml+
              '<tr><td style="height:22px;line-height:22px;font-size:1px">&nbsp;</td></tr>'+
            '</table>'+
          '</td></tr>'+
        '</table>'+
        '<table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:480px"><tr>'+
          '<td bgcolor="'+EMAIL_FOOT+'" class="pv-bg-foot" style="background:'+EMAIL_FOOT+';padding:26px 20px" align="center">'+
            '<img src="'+EMAIL_LOGO_URL+'" width="30" height="30" alt="Pivots" style="display:block;margin:0 auto 12px;border-radius:7px">'+
            '<div class="pv-ink" style="font-family:'+EMAIL_FONT_DISPLAY+';font-size:14px;font-weight:400;color:'+EMAIL_TINTA+';margin-bottom:6px">Your contacts, into contracts.</div>'+
            '<div class="pv-soft" style="font-family:'+EMAIL_FONT+';font-size:12px;color:'+EMAIL_CINZA+';margin-bottom:14px">'+
              '<a href="#" class="pv-soft" style="color:'+EMAIL_CINZA+';text-decoration:none">Central de Ajuda</a> &nbsp;&middot;&nbsp; '+
              '<a href="#" class="pv-soft" style="color:'+EMAIL_CINZA+';text-decoration:none">Privacidade</a> &nbsp;&middot;&nbsp; '+
              '<a href="#" class="pv-soft" style="color:'+EMAIL_CINZA+';text-decoration:none">Termos</a>'+
            '</div>'+
            '<div class="pv-soft" style="font-family:'+EMAIL_FONT+';font-size:11px;color:#A8A296">&copy; '+new Date().getFullYear()+' Pivots. Todos os direitos reservados.'+(opts.footerReason?'<br>'+opts.footerReason:'')+'</div>'+
          '</td>'+
        '</tr></table>'+
      '</td></tr></table>';
    return emailDocWrap(inner);
  }
  /* ===== Template universal de email — reutilizado por todos os tipos de notificação =====
     Branding (logo/nome/contactos da empresa) só aparece nos planos Business/Enterprise;
     nos restantes planos essa secção fica vazia (sem inventar dados). */
  const TIPOS_EMAIL = {
    contratoEnviado:    { badgeKey:'email.badge.contractSent',     titleKey:'email.title.contractSent',     bodyKey:'email.body.contractSent',     ctaKey:'email.cta.signContract',   deadline:true,  doneUpTo:-1, current:0, heroIcon:'hero-folder' },
    contratoAssinado:   { badgeKey:'email.badge.contractSigned',   titleKey:'email.title.contractSigned',   bodyKey:'email.body.contractSigned',   ctaKey:'email.cta.viewProject',    deadline:false, doneUpTo:0,  current:1, heroIcon:'hero-check' },
    briefingDisponivel: { badgeKey:'email.badge.briefingReady',    titleKey:'email.title.briefingReady',    bodyKey:'email.body.briefingReady',    ctaKey:'email.cta.fillBriefing',   deadline:true,  doneUpTo:0,  current:1, heroIcon:'hero-alert' },
    briefingPreenchido: { badgeKey:'email.badge.briefingDone',     titleKey:'email.title.briefingDone',     bodyKey:'email.body.briefingDone',     ctaKey:'email.cta.viewProject',    deadline:false, doneUpTo:1,  current:2, heroIcon:'hero-check' },
    pagamentoPendente:  { badgeKey:'email.badge.paymentDue',       titleKey:'email.title.paymentDue',       bodyKey:'email.body.paymentDue',       ctaKey:'email.cta.payNow',         deadline:true,  doneUpTo:1,  current:2, heroIcon:'hero-alert' },
    pagamentoRecebido:  { badgeKey:'email.badge.paymentReceived',  titleKey:'email.title.paymentReceived',  bodyKey:'email.body.paymentReceived',  ctaKey:'email.cta.viewProject',    deadline:false, doneUpTo:2,  current:3, heroIcon:'hero-check' },
    entregaDisponivel:  { badgeKey:'email.badge.deliveryReady',    titleKey:'email.title.deliveryReady',    bodyKey:'email.body.deliveryReady',    ctaKey:'email.cta.reviewDelivery', deadline:true,  doneUpTo:3,  current:4, heroIcon:'hero-box' },
    entregaAprovada:    { badgeKey:'email.badge.deliveryApproved', titleKey:'email.title.deliveryApproved', bodyKey:'email.body.deliveryApproved', ctaKey:'email.cta.viewProject',    deadline:false, doneUpTo:4,  current:-1, heroIcon:'hero-check' },
    projetoConcluido:   { badgeKey:'email.badge.projectDone',      titleKey:'email.title.projectDone',      bodyKey:'email.body.projectDone',      ctaKey:'email.cta.viewProject',    deadline:false, doneUpTo:4,  current:-1, heroIcon:'hero-check' },
    acessoPortal:       { badgeKey:'email.badge.portalAccess',     titleKey:'email.title.portalAccess',     bodyKey:'email.body.portalAccess',     ctaKey:'email.cta.openPortal',     deadline:false, doneUpTo:-1, current:-1, heroIcon:'hero-folder' },
    atualizacaoProjeto: { badgeKey:'email.badge.projectUpdate',    titleKey:'email.title.projectUpdate',    bodyKey:'email.body.projectUpdate',    ctaKey:'email.cta.viewUpdate',     deadline:false, doneUpTo:-1, current:-1, heroIcon:'hero-folder' },
    acaoNecessaria:     { badgeKey:'email.badge.actionNeeded',     titleKey:'email.title.actionNeeded',     bodyKey:'email.body.actionNeeded',     ctaKey:'email.cta.resolveNow',     deadline:true,  doneUpTo:-1, current:-1, heroIcon:'hero-alert' },
    eventoAgendado:     { badgeKey:'email.badge.eventScheduled',   titleKey:'email.title.eventScheduled',   bodyKey:'email.body.eventScheduled',   ctaKey:'email.cta.viewEvent',      deadline:false, doneUpTo:1,  current:2, heroIcon:'hero-folder' },
    documentoDisponivel:{ badgeKey:'email.badge.documentAvailable',titleKey:'email.title.documentAvailable',bodyKey:'email.body.documentAvailable',ctaKey:'email.cta.viewDocument',   deadline:false, doneUpTo:-1, current:-1, heroIcon:'hero-folder' },
    avaliacaoSolicitada:{ badgeKey:'email.badge.reviewRequest',    titleKey:'email.title.reviewRequest',    bodyKey:'email.body.reviewRequest',    ctaKey:'email.cta.leaveReview',    deadline:false, doneUpTo:4,  current:-1, heroIcon:'hero-check' }
  };
  const EMAIL_STAGE_KEYS=['email.stage.contract','email.stage.briefing','email.stage.payment','email.stage.execution','email.stage.delivery'];
  function planPermiteBranding(){ return perfilData.plano==='Business' || perfilData.plano==='Enterprise'; }
  function dadosNegocioParaEmail(){
    if(!planPermiteBranding()) return {logoUrl:'', nome:'', subtitulo:'', email:'', telefone:'', website:''};
    // empresaFotoUrl costuma ser um data URI (upload local guardado direto no
    // perfil, sem passar por storage) — funciona dentro da app mas o Gmail e
    // outros clientes bloqueiam <img src="data:..."> em emails por segurança,
    // resultando em imagem quebrada. Nesse caso cai para as iniciais, que
    // sempre carregam.
    const fotoUrl = perfilData.empresaFotoUrl||'';
    return {
      logoUrl: /^data:/i.test(fotoUrl) ? '' : fotoUrl,
      nome: perfilData.empresa||'',
      subtitulo: perfilData.categoria||'',
      email: perfilData.empresaEmail||'',
      telefone: perfilData.telefone||'',
      website: perfilData.website||''
    };
  }
  function emailBrandHeadHtml(){
    const b=dadosNegocioParaEmail();
    if(!b.nome && !b.email && !b.telefone && !b.website) return '';
    const inicial=(b.nome||'?').charAt(0).toUpperCase();
    const logo = b.logoUrl ? '<img src="'+b.logoUrl+'" alt="">' : inicial;
    const contactos=[b.email, b.telefone, b.website].filter(Boolean).map(escapeHtml).join(' &nbsp;·&nbsp; ');
    return '<div class="email-brand-head">'+
      '<div class="email-brand-logo">'+logo+'</div>'+
      (b.nome?'<div class="email-brand-name">'+escapeHtml(b.nome)+'</div>':'')+
      (b.subtitulo?'<div class="email-brand-sub">'+escapeHtml(b.subtitulo)+'</div>':'')+
      (contactos?'<div class="email-brand-contacts">'+contactos+'</div>':'')+
      '</div>';
  }
  function emailDetalhesEventoHtml(job){
    const linhas=[];
    if(job.date) linhas.push([t('email.detail.date'), job.date]);
    if(job.local) linhas.push([t('email.detail.location'), job.local]);
    if(!linhas.length) return '';
    return '<div class="email-details"><div class="ttl">'+t('email.eventDetailsTitle')+'</div>'+
      linhas.map(l=>'<div class="email-detail-row"><span>'+escapeHtml(l[0])+'</span><span>'+escapeHtml(l[1])+'</span></div>').join('')+
      '</div>';
  }
  function construirEmailUniversal(job, tipo, prazoTexto){
    const cfg=TIPOS_EMAIL[tipo];
    if(!cfg) return '';
    const stepperHtml='<div class="email-stepper"><div class="email-stepper-line"></div>'+
      EMAIL_STAGE_KEYS.map((key,i)=>{
        const state = i<=cfg.doneUpTo ? 'done' : (i===cfg.current ? 'now' : '');
        return '<div class="email-step '+state+'"><div class="dot">'+(state==='done'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>':'')+'</div><span class="lbl">'+t(key)+'</span></div>';
      }).join('')+
      '</div>';
    const deadlineHtml = (cfg.deadline && prazoTexto)
      ? '<div class="email-deadline">'+iconWrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')+'<div>'+t('email.deadlineLabel')+'<b>'+escapeHtml(prazoTexto)+'</b></div></div>'
      : '';
    return '<div class="email-note">'+iconWrap('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')+
      '<div>'+t('email.previewNote')+'</div></div>'+
      '<div class="email-mock">'+
        emailBrandHeadHtml()+
        '<div class="email-body" style="padding-top:22px">'+
          '<div class="email-badge">'+t(cfg.badgeKey)+'</div>'+
          '<h3 style="font-family:\'Jost\',sans-serif;font-weight:600;font-size:20px;margin:0 0 8px">'+t(cfg.titleKey)+'</h3>'+
          '<p style="font-size:13px;color:var(--ink-soft);margin:0 0 4px">'+t('email.greeting')+escapeHtml(job.client)+',</p>'+
          '<p style="font-size:13px;color:var(--ink-soft);margin:0 0 14px">'+t(cfg.bodyKey)+'</p>'+
          deadlineHtml+
          stepperHtml+
          emailDetalhesEventoHtml(job)+
          '<div class="email-cta">'+t(cfg.ctaKey)+'</div>'+
        '</div>'+
        '<div class="email-foot">Pivots &nbsp;·&nbsp; '+t('email.poweredBy')+'</div>'+
      '</div>';
  }
  /* Versão do template com estilos inline — para envio real via Resend.
     Clientes de email não carregam a folha de estilos da app nem entendem
     var(--...), por isso esta versão duplica o layout com cores fixas. */
  function construirEmailUniversalInline(job, tipo, prazoTexto){
    const cfg=TIPOS_EMAIL[tipo];
    if(!cfg) return '';
    const b=dadosNegocioParaEmail();
    // Quando o freelancer tem marca própria (plano Business/Enterprise), o
    // nome/logo dele aparece num bloco de identidade logo abaixo do
    // cabeçalho — a logo do Pivots continua no cabeçalho verde e no rodapé,
    // discreta, mantendo a marca da plataforma sempre visível.
    const brandBlock = (b.nome||b.email||b.telefone)
      ? '<tr><td style="padding:24px 26px 4px;text-align:center;border-bottom:1px solid '+EMAIL_LINHA_SUAVE+'">'+
        (b.logoUrl?'<img src="'+b.logoUrl+'" width="52" height="52" style="border-radius:50%;object-fit:cover;display:inline-block" alt="">':'<div class="pv-ink" style="width:52px;height:52px;border-radius:50%;background:'+EMAIL_TINTA+';color:#fff;display:inline-block;line-height:52px;font-size:19px;font-weight:700;font-family:'+EMAIL_FONT+'">'+escapeHtml((b.nome||'?').charAt(0).toUpperCase())+'</div>')+
        (b.nome?'<div class="pv-ink" style="margin-top:10px;font-weight:700;letter-spacing:.02em;font-size:14px;color:'+EMAIL_TINTA+';font-family:'+EMAIL_FONT+'">'+escapeHtml(b.nome)+'</div>':'')+
        (b.subtitulo?'<div class="pv-soft" style="font-size:11px;color:'+EMAIL_CINZA+';letter-spacing:.03em;margin-top:2px;font-family:'+EMAIL_FONT+'">'+escapeHtml(b.subtitulo)+'</div>':'')+
        ([b.email,b.telefone,b.website].filter(Boolean).length?'<div class="pv-soft" style="font-size:11px;color:'+EMAIL_CINZA+';margin-top:10px;padding-bottom:18px;font-family:'+EMAIL_FONT+'">'+[b.email,b.telefone,b.website].filter(Boolean).map(escapeHtml).join(' &nbsp;&middot;&nbsp; ')+'</div>':'<div style="padding-bottom:18px"></div>')+
        '</td></tr>' : '';
    const detalhes=[];
    if(cfg.deadline && prazoTexto) detalhes.push([t('email.deadlineLabel').replace(/\s+$/,''), prazoTexto]);
    if(job.date) detalhes.push([t('email.detail.date'), job.date]);
    if(job.local) detalhes.push([t('email.detail.location'), job.local]);
    return emailShellHtml({
      alerta: false,
      headerLabel: t(cfg.badgeKey),
      heroIcon: cfg.heroIcon,
      extraTop: brandBlock,
      heading: t(cfg.titleKey),
      body: t('email.greeting')+escapeHtml(job.client)+'. '+t(cfg.bodyKey),
      detalhes: detalhes.length ? detalhes : null,
      ctaText: t(cfg.ctaKey),
      ctaUrl: (job.contract&&job.contract.link)||'#',
      footerReason: t('email.poweredBy')
    });
  }
  /* devolve true se o email foi aceite pelo servidor, false caso contrário.
     Antes engolia qualquer erro em silêncio — o utilizador via "enviado" mas
     nada chegava (ex.: RESEND_API_KEY em falta no servidor). Agora o chamador
     pode avisar quando o envio realmente falha. `silencioso` evita o aviso nos
     disparos automáticos onde não queremos interromper o fluxo. */
  /* Envio real: manda só o TIPO do evento + os dados brutos do trabalho —
     é o servidor (api/emails/send-event.js) que escolhe qual dos 12
     templates reais usar e monta o HTML final. construirEmailUniversal/
     construirEmailUniversalInline continuam existindo só para a pré-
     visualização dentro do próprio Portal do Cliente (ver openClient), não
     fazem parte do envio de verdade. */
  async function dispararEmailEvento(tipo, destinatario, job, prazoTexto, silencioso){
    if(!destinatario) return false;
    const dados={
      nome: job.client, projeto: job.nome||job.typeLabel||'',
      ctaUrl: (job.contract&&job.contract.link) || window.location.origin,
      prazo: prazoTexto||null, codigo: job.contract&&job.contract.codigoAcesso,
    };
    if(tipo==='pagamentoRecebido'){
      dados.valor=fmtMoney(job.value||0);
      dados.data=new Date().toLocaleDateString(jsLocale(),{day:'2-digit',month:'2-digit',year:'numeric'});
    }
    try{
      const r=await fetch('/api/emails/send-event', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({to:destinatario, tipo, dados})});
      if(!r.ok){ if(!silencioso) showToast(t('toast.emailFailed')); return false; }
      return true;
    }catch(e){ if(!silencioso) showToast(t('toast.emailFailed')); return false; }
  }

  /* ===== Emails de conta / plataforma — sem trabalho associado =====
     Cobre: Conta e Acesso, Plano e Assinatura, Convite para Equipa,
     Segurança e Auditoria, Comunicação da Plataforma. Layout mais simples
     que o universal (sem stepper, sem detalhes de evento) — cabeçalho com
     a marca do próprio Pivots (não a do freelancer, como nos emails de
     trabalho), badge, título, corpo, bloco de detalhes opcional (ex.
     dispositivo/local num alerta de segurança, ou o código de recuperação),
     botão de ação opcional e rodapé. */
  const TIPOS_EMAIL_CONTA = {
    contaCriada:          { badgeKey:'email.badge.accountCreated',        titleKey:'email.title.accountCreated',        bodyKey:'email.body.accountCreated',        ctaKey:'email.cta.accountCreated', heroIcon:'hero-check' },
    confirmarEmail:       { badgeKey:'email.badge.confirmEmail',          titleKey:'email.title.confirmEmail',          bodyKey:'email.body.confirmEmail',          ctaKey:'email.cta.confirmEmail', heroIcon:'hero-mailcheck' },
    redefinirSenha:       { badgeKey:'email.badge.resetPassword',         titleKey:'email.title.resetPassword',         bodyKey:'email.body.resetPassword',         ctaKey:'email.cta.resetPassword', hintKey:'email.hint.resetPassword', heroIcon:'hero-lock' },
    senhaAlterada:        { badgeKey:'email.badge.passwordChanged',       titleKey:'email.title.passwordChanged',       bodyKey:'email.body.passwordChanged',       ctaKey:'email.cta.passwordChanged', alerta:true, heroIcon:'hero-alert' },
    recuperarAcesso:      { badgeKey:'email.badge.recoverAccess',         titleKey:'email.title.recoverAccess',         bodyKey:'email.body.recoverAccess',         codigo:true, heroIcon:'hero-lock' },
    assinaturaAtiva:      { badgeKey:'email.badge.subscriptionActive',    titleKey:'email.title.subscriptionActive',    bodyKey:'email.body.subscriptionActive',    ctaKey:'email.cta.subscriptionActive', heroIcon:'hero-check' },
    renovacaoProxima:     { badgeKey:'email.badge.renewalUpcoming',       titleKey:'email.title.renewalUpcoming',       bodyKey:'email.body.renewalUpcoming',       ctaKey:'email.cta.renewalUpcoming', heroIcon:'hero-folder' },
    pagamentoFalhouConta: { badgeKey:'email.badge.paymentFailed',         titleKey:'email.title.paymentFailed',         bodyKey:'email.body.paymentFailed',         ctaKey:'email.cta.paymentFailed', alerta:true, heroIcon:'hero-alert' },
    planoAlterado:        { badgeKey:'email.badge.planChanged',          titleKey:'email.title.planChanged',           bodyKey:'email.body.planChanged',           ctaKey:'email.cta.planChanged', heroIcon:'hero-check' },
    assinaturaCancelada:  { badgeKey:'email.badge.subscriptionCancelled', titleKey:'email.title.subscriptionCancelled', bodyKey:'email.body.subscriptionCancelled', ctaKey:'email.cta.subscriptionCancelled', heroIcon:'hero-folder' },
    conviteEquipe:        { badgeKey:'email.badge.teamInvite',           titleKey:'email.title.teamInvite',            bodyKey:'email.body.teamInvite',            ctaKey:'email.cta.teamInvite', features:['team','folder','bell'] },
    conviteAceito:        { badgeKey:'email.badge.inviteAccepted',       titleKey:'email.title.inviteAccepted',        bodyKey:'email.body.inviteAccepted',        ctaKey:'email.cta.inviteAccepted', heroIcon:'hero-check' },
    colaboradorJobConvite:  { badgeKey:'email.badge.jobCollab', titleKey:'email.title.jobCollabInvite', bodyKey:'email.body.jobCollabInvite', ctaKey:'email.cta.jobCollabInvite', codigo:true, features:['team','folder','bell'] },
    colaboradorJobAdicionado:{ badgeKey:'email.badge.jobCollab', titleKey:'email.title.jobCollabAdded',  bodyKey:'email.body.jobCollabAdded',  ctaKey:'email.cta.jobCollabAdded', features:['team','folder','bell'] },
    colaboradorContratoPronto:{ badgeKey:'email.badge.jobCollab', titleKey:'email.title.jobCollabContract', bodyKey:'email.body.jobCollabContract', ctaKey:'email.cta.jobCollabContract', features:['team','folder','bell'] },
    novoLogin:            { badgeKey:'email.badge.newLogin',             titleKey:'email.title.newLogin',              bodyKey:'email.body.newLogin',              ctaKey:'email.cta.newLogin', alerta:true, heroIcon:'hero-alert' },
    alteracaoCritica:     { badgeKey:'email.badge.criticalChange',       titleKey:'email.title.criticalChange',        bodyKey:'email.body.criticalChange',        ctaKey:'email.cta.criticalChange', alerta:true, heroIcon:'hero-alert' },
    atividadeSuspeita:    { badgeKey:'email.badge.suspiciousActivity',   titleKey:'email.title.suspiciousActivity',    bodyKey:'email.body.suspiciousActivity',    ctaKey:'email.cta.suspiciousActivity', alerta:true, heroIcon:'hero-alert' },
    novidadePlataforma:   { badgeKey:'email.badge.platformNews',         titleKey:'email.title.platformNews',          bodyKey:'email.body.platformNews',          ctaKey:'email.cta.platformNews', heroIcon:'hero-folder' },
    manutencaoProgramada: { badgeKey:'email.badge.maintenance',          titleKey:'email.title.maintenance',           bodyKey:'email.body.maintenance', heroIcon:'hero-alert' },
    alteracaoTermos:      { badgeKey:'email.badge.termsChange',          titleKey:'email.title.termsChange',           bodyKey:'email.body.termsChange',           ctaKey:'email.cta.termsChange', heroIcon:'hero-folder' },
    portalCriado:         { badgeKey:'email.badge.portalCreated',        titleKey:'email.title.portalCreated',         bodyKey:'email.body.portalCreated',         ctaKey:'email.cta.portalCreated', codigo:true, heroIcon:'hero-mailcheck' }
  };
  /* dados = { nome, eyebrow, avatarLetras, avatarCor, bodyOverride, ctaUrl, codigo,
     detalhes:[[label,valor],...] } — todos opcionais. eyebrow/avatarLetras normalmente
     são "quem despoletou a ação" (quem convidou, quem adicionou); bodyOverride permite
     compor um corpo com nomes/valores dinâmicos sem precisar de interpolação no i18n. */
  function construirEmailContaInline(tipo, dados){
    dados=dados||{};
    const cfg=TIPOS_EMAIL_CONTA[tipo];
    if(!cfg) return '';
    const nomeSaudacao = dados.nome ? escapeHtml(dados.nome) : t('email.greetingGeneric');
    const corpo = dados.bodyOverride || (t('email.greetingGeneric')+', '+nomeSaudacao+'. '+t(cfg.bodyKey));
    return emailShellHtml({
      alerta: !!cfg.alerta,
      headerLabel: t(cfg.badgeKey),
      heroIcon: cfg.heroIcon,
      eyebrow: dados.eyebrow || null,
      heading: t(cfg.titleKey),
      body: corpo,
      avatarLetras: dados.avatarLetras || null,
      avatarCor: dados.avatarCor || null,
      avatarFoto: dados.avatarFoto || null,
      features: cfg.features ? cfg.features.map(icon=>({icon, titulo:t('email.feature.'+(icon==='team'?'team':icon==='folder'?'projects':'notify')+'.title'), desc:t('email.feature.'+(icon==='team'?'team':icon==='folder'?'projects':'notify')+'.desc')})) : null,
      detalhes: dados.detalhes || null,
      codigo: cfg.codigo ? dados.codigo : null,
      ctaText: cfg.ctaKey ? t(cfg.ctaKey) : null,
      ctaUrl: dados.ctaUrl,
      hint: cfg.hintKey ? t(cfg.hintKey) : (dados.hint || null),
      footerReason: dados.footerReason || t('email.footer.autoNotice')
    });
  }
  /* Envio real (mesmo espírito de dispararEmailEvento acima): manda só o
     tipo + dados brutos, o servidor escolhe o template certo entre os 12
     reais. `dados` aqui usa o vocabulário novo (remetente/projeto/email/
     ctaUrl/codigo/novoUsuario...), não mais o formato antigo de
     construirEmailContaInline (eyebrow/avatarLetras/bodyOverride...). */
  async function dispararEmailConta(tipo, destinatario, dados, silencioso){
    if(!destinatario) return false;
    try{
      const r=await fetch('/api/emails/send-event', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({to:destinatario, tipo, dados})});
      if(!r.ok){ if(!silencioso) showToast(t('toast.emailFailed')); return false; }
      return true;
    }catch(e){ if(!silencioso) showToast(t('toast.emailFailed')); return false; }
  }

  /* Pede (ou corrige) o email do cliente deste trabalho quando ele falta.
     Guarda no trabalho E no registo do cliente, para que da próxima vez já
     esteja preenchido. Continua a ação original (aposGuardar) a seguir. */
  function pedirEmailCliente(id, aposGuardar){
    const job=jobsData[id];
    if(!job) return;
    openInfo(t('job.clientEmailTitle'), `
      <p class="u-hint">${t('job.clientEmailHint').replace('{client}', escapeHtml(job.client))}</p>
      <div class="field"><label>Email</label><input id="ce-email" type="email" value="${escapeHtml(job.email||'')}" placeholder="example@email.com" autocomplete="off" name="ce-email-cliente"></div>
      <button class="btn primary u-w-full u-mt-6" onclick="guardarEmailCliente('${id}')">${t('action.save')}</button>`);
    _aposGuardarEmail = aposGuardar || null;
    setTimeout(()=>{ const el=document.getElementById('ce-email'); if(el) el.focus(); }, 60);
  }
  let _aposGuardarEmail=null;
  function guardarEmailCliente(id){
    const job=jobsData[id];
    if(!job) return;
    const email=(document.getElementById('ce-email').value||'').trim();
    if(!email || !email.includes('@')){ showToast(t('toast.invalidEmail')); return; }
    job.email=email;
    upsertClientePorNome(job.client, {email});
    saveJobsData();
    closeInfo();
    const cb=_aposGuardarEmail; _aposGuardarEmail=null;
    if(typeof cb==='function') setTimeout(cb, 60);
  }
  /* "Reenviar Email" só reenvia o MESMO email de acesso ao portal já
     enviado automaticamente na criação do trabalho (link + código) — não
     dispara um novo tipo de notificação. Se por algum motivo o job ainda
     não tiver link/código (jobs antigos, criados antes desta automação),
     gera-os agora antes de reenviar. */
  async function enviarPorEmail(id){
    const job=jobsData[id];
    if(!job.email){ pedirEmailCliente(id, ()=>enviarPorEmail(id)); return; }
    if(!job.contract.link || !job.contract.codigoAcesso) await gerarPortalClienteAutomatico(job);
    const ok=await dispararEmailConta('portalCriado', job.email, { nome: job.client, projeto: job.nome||job.typeLabel||'', ctaUrl: job.contract.link, codigo: job.contract.codigoAcesso });
    pushHistory(job,t('history.emailClientOpened'));
    saveJobsData();
    closeInfo();
    if(ok) showToast(t('toast.emailSent'));
  }
  /* Gera um código de acesso de 6 dígitos para o portal — o cliente precisa
     do link E do código para entrar, não só do link (reduz acessos indevidos
     a quem intercepta o link sozinho). Guardado no próprio job, sem exigir
     alterações de esquema no Supabase. */
  function gerarCodigoAcessoPortal(){
    return String(Math.floor(100000+Math.random()*900000));
  }
  function construirMensagemPortalCliente(job){
    return t('portal.shareMessageGreeting')+'\n\n'+t('portal.shareMessageIntro')+'\n\n'+
      t('portal.shareMessageLinkLabel')+' '+(job.contract.link||'')+'\n\n'+
      t('portal.shareMessageCodeLabel')+' '+(job.contract.codigoAcesso||'')+'\n\n'+
      t('portal.shareMessageSecurity');
  }
  /* Botões do modal do Portal sempre no mesmo componente neutro (.btn.dark)
     — nada de verde de marca aqui, é uma ação de compartilhamento, não a
     ação primária da tela. */
  function abrirCompartilharPortal(id){
    const job=jobsData[id];
    if(!job){ showToast(t('toast.jobNotFound')); return; }
    if(!job.contract.link){
      openInfo(t('portal.shareTitle'), `
        <p class="u-hint">${t('portal.shareGenerateHint')}</p>
        <button class="btn dark u-w-full" onclick="abrirDefinirPrazoPortal('${id}')">${t('job.contract.getLink')}</button>`);
    } else {
      openInfo(t('portal.shareTitle'), `
        <p class="u-hint">${t('portal.shareActiveHint')}</p>
        <button class="btn dark u-w-full u-mb-8" onclick="enviarPorEmail('${id}')">${t('portal.resendEmail')}</button>
        <button class="btn dark u-w-full" onclick="abrirCopiarMensagemPortal('${id}')">${t('portal.copyAccess')}</button>`);
    }
  }
  function abrirCopiarMensagemPortal(id){
    const job=jobsData[id];
    if(!job) return;
    const msg=construirMensagemPortalCliente(job);
    openInfo(t('portal.copyAccess'), `
      <p class="u-sm-nd u-mb-8">${t('portal.editMessageHint')}</p>
      <textarea id="portal-msg-editavel" style="width:100%;min-height:170px;font-size:13px;font-family:inherit;padding:10px;border:1px solid var(--line);border-radius:var(--r);resize:vertical">${escapeHtml(msg)}</textarea>
      <button class="btn dark u-w-full u-mt-10" onclick="copiarMensagemPortalEditada()">${t('action.copyLink')}</button>`);
  }
  function copiarMensagemPortalEditada(){
    const texto=document.getElementById('portal-msg-editavel').value;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(texto).then(()=>{ showToast(t('toast.linkCopied')); closeInfo(); }).catch(()=>showToast(texto));
    } else { showToast(texto); }
  }

  function marcarPagoDynamic(id,i){
    const job=jobsData[id];
    const viaComprovativo = job.payments[i].status==='a_confirmar';
    job.payments[i].status='pago';
    job.payments[i].pagoEm=new Date().toISOString().slice(0,10);
    pushHistory(job, job.payments[i].label+(viaComprovativo?t('payment.history.confirmed'):t('payment.history.marked')));
    saveJobsData(); renderJobDetailDynamic(id); updateJobCard(id); renderMonthTicker();
    showToast(viaComprovativo? t('payment.confirmed') : t('payment.markedPaid'));
    dispararEmailEvento('pagamentoRecebido', job.email, job);
    registrarAnalyticsPagamento(job, job.payments[i]);
  }
  /* Termina a recorrência: não gera mais ciclos, mas mantém as cobranças já
     criadas (incluindo pendentes) para não apagar histórico financeiro. */
  function terminarRecorrenciaJob(id){
    const job=jobsData[id];
    if(!job || !job.recorrencia) return;
    job.recorrencia.ativa=false;
    pushHistory(job, t('recur.stopped'));
    saveJobsData(); renderJobDetailDynamic(id);
    showToast(t('recur.stopped'));
  }

  /* Indicador de status único para toda a aplicação — Contrato, Briefing,
     Timeline, Pagamentos, Entregas, Aprovações usam sempre os mesmos 4
     estados. Ícones reais (mesma linguagem visual do resto do app —
     stroke, viewBox 24x24), não emojis. */
  const STATUS_ICONS={
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.6 2.6L16 9.3"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3.2 1.8"/></svg>',
    pending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l-2.6 1.8"/></svg>',
    late: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 9v4M12 17h.01M10.3 3.86 1.8 18a1 1 0 0 0 .87 1.5h18.66a1 1 0 0 0 .87-1.5L13.7 3.86a1 1 0 0 0-1.74 0Z"/></svg>'
  };
  /* só as 4 cores da paleta desta página (verde escuro/âmbar escuro/cinza
     quente/vermelho) — nunca azul, nunca cores saturadas. */
  const STATUS_COLORS={done:'var(--c-text-green)', progress:'var(--pend)', pending:'var(--ink-soft)', late:'var(--c-text-red)'};
  function statusEmoji(status){
    const s=STATUS_ICONS[status]?status:'pending';
    return '<span style="display:inline-flex;vertical-align:-3px;width:15px;height:15px;color:'+STATUS_COLORS[s]+'">'+STATUS_ICONS[s]+'</span>';
  }
  /* Card de Timeline do Portal Operacional — mesmo motor da timeline
     bidirecional do Portal do Cliente (construirTimelineBidirecional), para
     nunca haver duas versões divergentes do mesmo progresso. Cada item
     segue sempre a ordem: Status, Título, Descrição, Data, Ação. */
  function timelineCardHtml(job){
    const passos=construirTimelineBidirecional(job);
    if(!passos.length) return '';
    let html='<div class="sec"><div class="sec-head u-cur-default"><div class="sec-l">'+BADGE_CLOCK+'<div class="sec-title">'+t('job.timeline')+'</div></div></div><div class="timeline">';
    passos.forEach((p,i)=>{
      html+='<div class="tl">'+(i<passos.length-1?'<div class="tl-line"></div>':'')+
        '<div class="tl-dot-status">'+statusEmoji(p.status)+'</div>'+
        '<div class="tl-body">'+
          '<div class="t">'+escapeHtml(p.label)+'</div>'+
          (p.desc?'<div class="m">'+escapeHtml(p.desc)+'</div>':'')+
          (p.data?'<div class="tl-date">'+escapeHtml(p.data)+'</div>':'')+
          (p.acaoLabel?'<button class="btn ghost" style="padding:5px 10px;font-size:11px;margin-top:6px" onclick="'+p.acaoFn+'">'+escapeHtml(p.acaoLabel)+'</button>':'')+
        '</div></div>';
    });
    html+='</div></div>';
    return html;
  }
  /* Cabeçalho da página do Projeto — uma única linha com as informações
     principais do evento (cliente · data · hora), mesmos ícones/peso/
     opacidade do resto do app (iconWrap, stroke 1.7). Sem valor financeiro
     aqui — isso já tem card próprio na secção de Pagamentos. */
  /* job.date é um texto já formatado (dia/mês abreviado + hora, ex.
     "22 de jul., 04:28") pensado pro card de lista — errado aqui: a data
     nunca deve levar horário (isso é o item seguinte, próprio) e precisa
     do mês por extenso. Formata direto a partir de job.dateRaw (ISO). */
  function fmtDataExtenso(dataISO){
    const dt=new Date(dataISO+'T00:00:00');
    return dt.toLocaleDateString(jsLocale(), {day:'numeric', month:'long', year:'numeric'});
  }
  function detailMetaRowHtml(job){
    const linha1='<span class="dm-item">'+ICON_PERSON_SM+'<span>'+escapeHtml(job.client)+'</span></span>';
    const itens2=[];
    if(job.dateRaw) itens2.push('<span class="dm-item">'+ICON_CAL_SM+'<span>'+escapeHtml(fmtDataExtenso(job.dateRaw))+'</span></span>');
    if(job.horaIni) itens2.push('<span class="dm-item">'+ICON_CLOCK+'<span>'+escapeHtml(job.horaIni+(job.horaFim?(' - '+job.horaFim):''))+'</span></span>');
    let html='<div class="dm-row">'+linha1+'</div>';
    if(itens2.length) html+='<div class="dm-row">'+itens2.join('<span class="dm-sep"></span>')+'</div>';
    return html;
  }
  function renderJobDetailDynamic(id){
    const job=jobsData[id];
    document.getElementById('d-title').textContent=job.nome||job.typeLabel;
    document.getElementById('d-meta-row').innerHTML=detailMetaRowHtml(job);
    const calSyncEl=document.getElementById('d-cal-sync');
    if(job.calendarioSync){
      calSyncEl.style.display='block';
      calSyncEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;vertical-align:-2px;margin-right:4px"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'+
        (job.calendarioSync==='google'?'Google Calendar':'Apple Calendar')+' sincronizado';
    } else {
      calSyncEl.style.display='none';
    }
    const avEl=document.getElementById('d-avatar');
    avEl.textContent=avatarInitials(job.client); avEl.style.background=avatarColor(job.client);

    let html='';
    const sv=job.servico;
    if(sv && (sv.servicos.length || sv.horas || sv.equipa || sv.equipamento.length)){
      let bits=[];
      if(sv.servicos.length) bits.push(sv.servicos.join(' + '));
      if(sv.horas) bits.push(sv.horas+'h');
      if(sv.equipa) bits.push(sv.equipa+' na equipe');
      if(sv.equipamento.length) bits.push(sv.equipamento.join(', '));
      html+='<div class="card-info" style="margin:0 0 16px;padding-top:0;border-top:none">';
      html+='<div class="card-info-item"><span class="lbl">Serviço</span><span class="val">'+(sv.servicos[0]||job.typeLabel)+'</span></div>';
      if(sv.horas) html+='<div class="card-info-item"><span class="lbl">Duração</span><span class="val">'+sv.horas+'h</span></div>';
      if(sv.equipa) html+='<div class="card-info-item"><span class="lbl">'+t('profile.team')+'</span><span class="val">'+sv.equipa+' pessoa'+(sv.equipa==='1'?'':'s')+'</span></div>';
      html+='</div>';
    }
    if(job.recursos && job.recursos.length){
      html+='<p class="csec-label" style="margin:0 2px 8px">'+t('job.resources')+'</p>';
      job.recursos.forEach(r=>{
        html+='<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(r.nome)+'</div><span class="sub">'+escapeHtml(r.tipo)+'</span></div>'+(r.custo?('<b class="u-label">'+fmtMoney(r.custo)+'</b>'):'')+'</div>';
      });
    }
    if(job.modo==='rapido'){
      html+='<div class="warn-box" style="background:var(--paper-2);border-color:var(--line);color:var(--ink-soft);margin-bottom:14px">'+
        iconWrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')+
        '<div>Projeto rápido: fica na sua agenda com lembrete na data. Sem contrato nem briefing.</div></div>';
    }

    html+=mapCardHtml(job);

    html+='<div class="sec"><div class="sec-head u-cur-default"><div class="sec-l">'+BADGE_DOC+'<div class="sec-title">'+t('job.contract')+'</div></div>'+contractStatusTagHtml(job)+'</div><div class="sec-body u-block">';
    if(job.contract.status==='vazio'){
      /* decisão de ter ou não contrato é feita na criação do trabalho — depois
         de criado, não é mais possível anexar nem alterar isso aqui. */
      html+='<p class="u-hint-bare">'+t('job.contract.missing')+'</p>';
    } else {
      // rascunho / enviado / assinado: resumo único (modelo, status, datas) + Ver Contrato
      html+='<div class="u-hint-bare u-lh-185 u-mb-10">';
      html+='<div><span class="u-c-neutral">'+t('resumo.contractTemplate')+':</span> '+escapeHtml(job.contract.templateName||t('job.contract.custom'))+'</div>';
      if(job.contract.enviadoEm) html+='<div><span class="u-c-neutral">'+t('job.contract.sentOn')+':</span> '+job.contract.enviadoEm+'</div>';
      if(job.contract.signedAt) html+='<div><span class="u-c-neutral">'+t('portal.signedOn')+':</span> '+job.contract.signedAt+'</div>';
      html+='</div>';
      html+='<button class="btn soft u-w-full" onclick="abrirBuilder(\''+id+'\')">'+t('job.contract.view')+'</button>';
      if(job.contract.status==='rascunho') html+='<button class="btn primary u-w-full u-mt-8" onclick="abrirDefinirPrazoPortal(\''+id+'\')">'+t('job.contract.getLink')+'</button>';
      if(job.contract.status==='assinado') html+='<button class="btn ghost u-w-full u-mt-8" onclick="descarregarCopiaContrato(\''+id+'\')">'+t('job.contract.download')+'</button>';
    }
    html+='</div></div>';

    if(job.structure.briefing && job.briefing){
      const respondido=job.briefing.respondido;
      html+='<div class="sec" id="sec-briefing-dyn"><div class="sec-head" onclick="toggleSec(this)"><div class="sec-l">'+BADGE_BRIEF+'<div class="sec-title"><span data-t="job.clientInfo">'+t('job.clientInfo')+'</span></div></div><div style="display:flex;align-items:center;gap:7px"><div class="sec-state u-c-ink">'+gerarEstadoInformacoesCliente(job)+'</div><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div></div><div class="sec-body">';
      if(job.briefing.prazo){
        const prazoTxt=job.briefing.prazo.split('-').reverse().join('/');
        const expirado=diasEntre(job.briefing.prazo)<0;
        html+='<p style="font-size:12.5px;color:'+(expirado?'var(--late)':'var(--neutral)')+';margin:0 2px 12px">'+(expirado?t('clientinfo.expiredOn'):t('clientinfo.availableUntil'))+prazoTxt+'</p>';
      }
      job.briefing.perguntas.forEach(p=>{
        html+='<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(p.q)+'</div></div><span style="font-size:12.5px;color:'+(p.r?'var(--ink)':'var(--neutral)')+'">'+(escapeHtml(p.r)||'sem resposta')+'</span></div>';
      });
      if(job.briefing.cronograma && job.briefing.cronograma.some(m=>m.hora)){
        html+='<p class="csec-label u-m-16-2-6">'+t('job.eventSchedule')+'</p>';
        job.briefing.cronograma.forEach(m=>{
          if(!m.hora) return;
          html+='<div class="struct-row"><div class="struct-l"><div class="nm">'+escapeHtml(m.momento)+'</div></div><span style="font-size:13px;font-weight:600;color:var(--ink)">'+escapeHtml(m.hora)+'</span></div>';
        });
      }
      if(job.briefing.pessoasImportantes && job.briefing.pessoasImportantes.length){
        html+='<p class="csec-label u-m-16-2-6">'+t('job.keyPeople')+'</p>';
        job.briefing.pessoasImportantes.forEach(c=>{
          html+='<div class="conv-row"><div class="conv-av">'+avatarHtml(c.nome,32)+'</div>'+
            '<div class="conv-info"><div class="nm">'+escapeHtml(c.nome)+'</div><div class="sub">'+escapeHtml(c.funcao)+'</div></div></div>';
        });
      }
      if(job.briefing.observacoes){
        html+='<p class="csec-label u-m-16-2-6">'+t('job.importantNotes')+'</p>';
        html+='<p class="u-hint-bare u-lh-155">'+escapeHtml(job.briefing.observacoes)+'</p>';
      }
      if(!respondido && job.contract.status==='assinado'){
        html+='<p style="font-size:12px;color:var(--neutral);margin-top:8px">'+t('job.clientRespondsViaLink')+'</p>';
      }
      html+='</div></div>';
    }

    html+=timelineCardHtml(job);

    if(job.payments.length){
      html+='<div class="sec"><div class="sec-head u-cur-default"><div class="sec-l">'+BADGE_MONEY+'<div class="sec-title">'+t('job.payments')+'</div></div></div><div class="sec-body u-block">';
      const rec=job.recorrencia;
      if(rec){
        const freqLabel=t((RECORRENCIA_FREQ[rec.frequencia]||{}).labelKey||'recur.freq.monthly');
        const sufixo=t((RECORRENCIA_FREQ[rec.frequencia]||{}).sufixoKey||'recur.per.month');
        html+='<div class="struct-row" style="flex-direction:column;align-items:stretch;gap:6px;padding:12px 2px;background:var(--paper-2);border-radius:var(--r);margin-bottom:8px">';
        html+='<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:13px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M17 2v4M3 8h18M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"/><path d="M17 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20.5 19.5 22 21"/></svg><span class="sig-tag" style="background:var(--btn-14);color:rgb(var(--btn-rgb))">'+t('recur.badge')+'</span> '+freqLabel+'</span><b style="font-size:14px">'+fmtMoney(rec.valorPorCiclo)+sufixo+'</b></div>';
        if(rec.ativa){
          html+='<div class="u-sm-soft">'+t('recur.nextCharge')+': '+rec.proximaCobranca.split('-').reverse().join('/')+(rec.fim?(' · até '+rec.fim.split('-').reverse().join('/')):'')+'</div>';
          html+='<button class="btn ghost" style="padding:6px 10px;font-size:11.5px;align-self:flex-start" onclick="terminarRecorrenciaJob(\''+id+'\')">'+t('recur.stop')+'</button>';
        } else {
          html+='<div class="u-sm-nd">'+t('recur.ended')+'</div>';
        }
        html+='</div>';
      }
      const hojeIso=new Date().toISOString().slice(0,10);
      job.payments.forEach((p,i)=>{
        const atrasada = p.status!=='pago' && p.dueDate && p.dueDate<hojeIso;
        const pStatus = p.status==='pago'?'done':(p.status==='a_confirmar'?'progress':(atrasada?'late':'pending'));
        const statusTxt = p.status==='pago'?t('payment.statusPaid'):(p.status==='a_confirmar'?t('payment.statusReceiptReceived'):(atrasada?t('timeline.status.late'):t('payment.statusPending')));
        const vencTxt = p.dueDate ? p.dueDate.split('-').reverse().join('/') : '—';
        const pagoTxt = p.pagoEm ? p.pagoEm.split('-').reverse().join('/') : null;
        html+='<div class="struct-row" style="padding:12px 2px;cursor:pointer;gap:10px" onclick="abrirDetalheParcela(\''+id+'\','+i+')">';
        html+='<div class="struct-l" style="flex:1;min-width:0"><div class="nm" style="font-weight:600;display:flex;align-items:center;gap:6px">'+statusEmoji(pStatus)+' '+escapeHtml(p.label)+' · '+fmtMoney(p.amount)+'</div>'+
          '<span class="sub">'+(pagoTxt?(t('payment.paidOn')+': '+pagoTxt):(t('payment.dueOn')+': '+vencTxt))+'</span></div>';
        const pTagClasse={done:'green',progress:'amber',pending:'gray',late:'late'}[pStatus];
        html+='<div class="u-row">';
        html+='<span class="sig-tag '+pTagClasse+'">'+statusTxt+'</span>';
        if(p.status!=='pago'){
          html+='<button class="btn soft" style="padding:6px 10px;font-size:11.5px;white-space:nowrap" onclick="event.stopPropagation();marcarPagoDynamic(\''+id+'\','+i+')">'+t('action.complete')+'</button>';
        }
        html+='</div></div>';
      });
      html+='</div></div>';
    }

    if(job.checklist){
      const feitos=job.checklist.itens.filter(c=>c.feito).length;
      html+='<div class="sec"><div class="sec-head u-cur-default"><div class="sec-l">'+BADGE_HIST+'<div class="sec-title" data-t="wizard.model.checklist">Checklist</div></div><div class="sec-state u-c-soft">'+feitos+'/'+job.checklist.itens.length+'</div></div><div class="sec-body u-block">';
      job.checklist.itens.forEach((c,i)=>{
        html+='<div class="struct-row"><div class="struct-l"><div class="nm" style="'+(c.feito?'text-decoration:line-through;color:var(--neutral)':'')+'">'+escapeHtml(c.t)+'</div></div><div class="toggle'+(c.feito?' on':'')+'" onclick="toggleChecklistItem(\''+id+'\','+i+',this)"><div class="kn"></div></div></div>';
      });
      html+='</div></div>';
    }

    const tarefasJob=Object.values(tarefasData).filter(t=>t.jobId===id);
    if(tarefasJob.length){
      html+='<div class="sec"><div class="sec-head u-cur-default"><div class="sec-l">'+BADGE_BELL+'<div class="sec-title" data-t="cost.tasks">Tarefas</div></div><div class="sec-state u-c-soft">'+tarefasJob.filter(t=>!t.feito).length+' por fazer</div></div><div class="sec-body u-block">';
      tarefasJob.forEach(t=>{
        html+='<div class="struct-row"><div class="struct-l"><div class="nm" style="display:flex;align-items:center;'+(t.feito?'text-decoration:line-through;color:var(--neutral)':'')+'"><span class="priority-dot '+prioClasse(t.prioridade)+'"></span>'+escapeHtml(t.titulo)+'</div><span class="sub">'+(t.prioridade||t('task.priorityNormal'))+(t.data?(' · '+t.data.split('-').reverse().slice(0,2).join('/')):'')+'</span></div><div class="toggle'+(t.feito?' on':'')+'" onclick="toggleTarefaItem(\''+t.id+'\',this)"><div class="kn"></div></div></div>';
      });
      html+='</div></div>';
    }

    const lembretesJob=Object.values(lembretesData).filter(l=>l.jobId===id);
    if(lembretesJob.length){
      html+='<div class="sec"><div class="sec-head u-cur-default"><div class="sec-l">'+BADGE_ALARM+'<div class="sec-title" data-t="reminder.sectionTitle">Lembretes</div></div><div class="sec-state u-c-soft">'+lembretesJob.filter(l=>!l.feito).length+' por fazer</div></div><div class="sec-body u-block">';
      lembretesJob.forEach(l=>{
        html+='<div class="struct-row"><div class="struct-l"><div class="nm" style="'+(l.feito?'text-decoration:line-through;color:var(--neutral)':'')+'">'+escapeHtml(l.titulo)+'</div><span class="sub">'+l.data.split('-').reverse().join('/')+(l.hora?(' · '+l.hora):'')+'</span></div><div class="toggle'+(l.feito?' on':'')+'" onclick="toggleLembreteItem(\''+l.id+'\',this)"><div class="kn"></div></div></div>';
      });
      html+='</div></div>';
    }

    const listasJob=Object.values(listasData).filter(ls=>ls.jobId===id);
    if(listasJob.length){
      html+='<div class="sec"><div class="sec-head u-cur-default"><div class="sec-l">'+BADGE_CHECKLIST+'<div class="sec-title" data-t="list.sectionTitle">Listas</div></div></div><div class="sec-body u-block">';
      listasJob.forEach(ls=>{
        const feitos=(ls.itens||[]).filter(it=>it.feito).length;
        html+='<div class="struct-row u-cur-pointer" onclick="abrirDetalheItemSolto(\'lista\',\''+ls.id+'\')"><div class="struct-l"><div class="nm">'+escapeHtml(ls.titulo)+'</div><span class="sub">'+feitos+'/'+(ls.itens||[]).length+'</span></div><svg class="chevr u-flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>';
      });
      html+='</div></div>';
    }

    html+='<div class="sec"><div class="sec-head u-cur-default"><div class="sec-l">'+BADGE_TEAM+'<div class="sec-title">'+t('collab.sectionTitle')+'</div></div><button class="btn ghost" style="padding:6px 11px;font-size:12px" onclick="abrirAdicionarColaboradorExterno(\''+id+'\')">'+t('collab.add')+'</button></div><div class="sec-body u-block">'+
      '<div id="colab-lista-'+id+'"><p class="u-label-nd">'+t('collab.loading')+'</p></div>'+
      '<button class="btn ghost" style="width:100%;margin-top:12px;border-top:1px solid var(--line-soft);padding-top:14px;border-radius:0 0 var(--r) var(--r)" onclick="abrirContratosColaboradores(\''+id+'\')">'+t('collab.contractsSection')+'</button>'+
    '</div></div>';

    document.getElementById('detalhe-dynamic').innerHTML=html;
    carregarColaboradoresJob(id);
    setTimeout(inicializarMapasCard, 30);
  }
  function toggleChecklistItem(jobId, i, el){
    const job=jobsData[jobId];
    job.checklist.itens[i].feito=!job.checklist.itens[i].feito;
    el.classList.toggle('on');
    saveJobsData();
    renderJobDetailDynamic(jobId);
  }
  function toggleTarefaItem(tarefaId, el){
    const t=tarefasData[tarefaId];
    t.feito=!t.feito;
    el.classList.toggle('on');
    saveTarefasData();
    if(t.jobId) renderJobDetailDynamic(t.jobId);
  }
  function prioClasse(p){
    return p==='Urgente' ? 'urgente' : p==='Importante' ? 'media' : 'normal';
  }
