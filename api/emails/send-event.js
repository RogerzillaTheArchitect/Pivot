/**
 * POST /api/emails/send-event
 * Body: { to, tipo, dados }
 *
 * Ponto único de disparo de todo email transacional originado no cliente
 * (index.html): dispararEmailEvento()/dispararEmailConta() só mandam o tipo
 * de evento + os dados brutos — é aqui que se decide qual dos 12 templates
 * reais (email-templates-v2/) usar e como preencher cada um, mantendo TODA
 * a lógica de mapeamento num único lugar (nunca duplicada entre cliente e
 * servidor). `tipo` usa o mesmo vocabulário que os antigos TIPOS_EMAIL/
 * TIPOS_EMAIL_CONTA de index.html, para a migração não exigir tocar em
 * todos os call-sites de uma vez.
 */
const { renderTemplate, assuntoDoTemplate, escapeHtml } = require('../_lib/emailTemplates');

/* ===== ícones reaproveitados dos próprios 12 templates (nunca um glyph novo)
   — Action Required troca só o <path>/<circle> interno do mesmo círculo de
   72px, por categoria de ação. ===== */
const ACTION_ICONS = {
  assinatura: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h6"/><path d="M8 17h4"/>',
  pagamento: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  briefing: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  revisao: '<path d="M4 12l5 5L20 6" stroke-width="2"/>',
  conclusao: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4" stroke-width="2"/>',
};

/* Formata dinheiro/data já vindos prontos do cliente (fmtMoney/fmt* de
   index.html) — este módulo não reformata valores, só monta o template. */
function evento(tipo, dados) {
  dados = dados || {};
  const b = dados.__blocks || {};

  switch (tipo) {
    // ===== Conta / plataforma =====
    case 'contaCriada':
      return { template: 'welcome', placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, PLAN_NAME: dados.plano || 'Free', ACTION_URL: dados.ctaUrl,
        PREHEADER: 'Sua conta Pivots está pronta. Comece a transformar contatos em contratos.',
      } };

    case 'confirmarEmail':
      // fluxo real do Pivots usa magic link (api/auth/signup.js, api/auth/resend.js) — nunca código.
      return { template: 'emailVerification', blocks: { ACCESS_CODE_ROW: false }, placeholders: {
        USER_NAME: dados.nome, VERIFY_INSTRUCTION: 'Clique no botão abaixo para confirmar seu e-mail e ativar sua conta Pivots.',
        EXPIRES_IN: dados.expiresIn || '24 horas', ACTION_URL: dados.ctaUrl,
        PREHEADER: 'Confirme seu e-mail para ativar sua conta Pivots.',
      } };

    case 'redefinirSenha':
    case 'recuperarAcesso':
      return { template: 'passwordReset', placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, IP_ADDRESS: dados.ip || '—', REQUEST_TIME: dados.quando || '—',
        EXPIRES_IN: dados.expiresIn || '1 hora', ACTION_URL: dados.ctaUrl,
        PREHEADER: 'Solicitação de redefinição de senha da sua conta Pivots.',
      } };

    case 'senhaAlterada':
      return { template: 'accountNotification', blocks: { CTA_BLOCK: true }, placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, EVENT_TITLE: 'Sua senha foi alterada',
        EVENT_DESCRIPTION: 'A senha da sua conta Pivots foi alterada com sucesso. Se não foi você, contate o suporte imediatamente.',
        EVENT_TIME: dados.quando || '—', ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Rever segurança da conta',
        PREHEADER: 'A senha da sua conta Pivots foi alterada.',
      } };

    case 'novoLogin':
      return { template: 'accountNotification', blocks: { CTA_BLOCK: true }, placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, EVENT_TITLE: 'Novo acesso à sua conta',
        EVENT_DESCRIPTION: 'Detectamos um novo login na sua conta Pivots' + (dados.local ? ' a partir de ' + dados.local : '') + '.',
        EVENT_TIME: dados.quando || '—', ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Rever segurança da conta',
        PREHEADER: 'Detectamos um novo login na sua conta Pivots.',
      } };

    case 'alteracaoCritica':
    case 'atividadeSuspeita':
      return { template: 'accountNotification', blocks: { CTA_BLOCK: true }, placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, EVENT_TITLE: dados.titulo || 'Alteração importante na sua conta',
        EVENT_DESCRIPTION: dados.descricao || 'Identificamos uma alteração sensível na sua conta Pivots.',
        EVENT_TIME: dados.quando || '—', ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Rever conta',
        PREHEADER: dados.titulo || 'Alteração importante na sua conta Pivots.',
      } };

    case 'assinaturaAtiva':
    case 'renovacaoProxima':
    case 'pagamentoFalhouConta':
    case 'planoAlterado':
    case 'assinaturaCancelada': {
      const titulos = {
        assinaturaAtiva: 'Sua assinatura está ativa', renovacaoProxima: 'Sua renovação está próxima',
        pagamentoFalhouConta: 'Não conseguimos processar seu pagamento', planoAlterado: 'Seu plano foi alterado',
        assinaturaCancelada: 'Sua assinatura foi cancelada',
      };
      return { template: 'accountNotification', blocks: { CTA_BLOCK: true }, placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, EVENT_TITLE: titulos[tipo],
        EVENT_DESCRIPTION: dados.descricao || (dados.plano ? 'Plano atual: ' + dados.plano + '.' : ''),
        EVENT_TIME: dados.quando || '—', ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Ver assinatura',
        PREHEADER: titulos[tipo],
      } };
    }

    case 'novidadePlataforma':
    case 'manutencaoProgramada':
    case 'alteracaoTermos': {
      const titulos = { novidadePlataforma: dados.titulo || 'Novidades no Pivots', manutencaoProgramada: 'Manutenção programada', alteracaoTermos: 'Atualizamos nossos Termos' };
      return { template: 'accountNotification', blocks: { CTA_BLOCK: !!dados.ctaUrl }, placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, EVENT_TITLE: titulos[tipo],
        EVENT_DESCRIPTION: dados.descricao || '', EVENT_TIME: dados.quando || '—',
        ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: dados.ctaLabel || 'Saber mais',
        PREHEADER: titulos[tipo],
      } };
    }

    case 'conviteAceito':
      return { template: 'accountNotification', blocks: { CTA_BLOCK: !!dados.ctaUrl }, placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, EVENT_TITLE: 'Novo membro na equipa',
        EVENT_DESCRIPTION: (dados.membro || 'Uma pessoa') + ' aceitou o convite e já faz parte da equipa' + (dados.empresa ? ' de ' + dados.empresa : '') + '.',
        EVENT_TIME: dados.quando || '—', ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Ver equipa',
        PREHEADER: 'Um novo membro aceitou o convite para a sua equipa.',
      } };

    // ===== Organização / equipa (workspace) =====
    case 'conviteEquipe':
    case 'organizationInvite': {
      const novoUsuario = !!dados.novoUsuario;
      return { template: 'organizationInvite', blocks: { USER_EMAIL_ROW: !novoUsuario }, placeholders: {
        ORGANIZATION_NAME: dados.empresa || 'Pivots', INVITER_NAME: dados.remetente || 'Um administrador',
        ROLE_SUFFIX: dados.papel ? (', como ' + dados.papel) : '', USER_EMAIL: dados.email,
        ORG_INVITE_INTRO: novoUsuario ? 'Crie sua conta para aceitar o convite e começar a colaborar.' : 'Utilize o botão abaixo para entrar e aceitar o convite.',
        ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: novoUsuario ? 'Criar conta e continuar' : 'Abrir organização',
        PREHEADER: (dados.remetente || 'Alguém') + ' convidou você para uma organização no Pivots.',
      } };
    }

    // ===== Portal do cliente =====
    case 'portalCriado':
    case 'acessoPortal':
      return { template: 'portalReady', blocks: { EXPIRES_ROW: !!dados.expiresAt, CONTRACT_NUMBER_ROW: false }, placeholders: {
        HEADER_LABEL: 'Acesso ao portal', HEADING: 'Seu portal está<br>pronto para acesso.',
        CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        PORTAL_INTRO: 'preparamos o seu portal exclusivo para acompanhar o projeto, assinar o contrato e enviar informações.',
        EXPIRES_AT: dados.expiresAt, ACCESS_CODE: dados.codigo, PORTAL_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Acessar portal',
        PREHEADER: 'Seu portal do cliente Pivots está pronto para acesso.',
      } };

    // ===== Ciclo do projeto (recipient = cliente) =====
    case 'contratoEnviado':
      return { template: 'portalReady', blocks: { EXPIRES_ROW: !!dados.prazo, CONTRACT_NUMBER_ROW: false }, placeholders: {
        HEADER_LABEL: 'Assinatura de contrato', HEADING: 'Seu contrato está pronto<br>para assinatura.',
        CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        PORTAL_INTRO: 'o contrato do seu projeto foi finalizado e aguarda apenas sua assinatura para darmos início ao trabalho.',
        EXPIRES_AT: dados.prazo, ACCESS_CODE: dados.codigo, PORTAL_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Assinar contrato',
        PREHEADER: 'Seu contrato está pronto para assinatura.',
      } };

    case 'briefingDisponivel':
      return { template: 'portalReady', blocks: { EXPIRES_ROW: !!dados.prazo, CONTRACT_NUMBER_ROW: false }, placeholders: {
        HEADER_LABEL: 'Assinatura e briefing', HEADING: 'Seu contrato e briefing<br>estão à sua espera.',
        CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        PORTAL_INTRO: 'o contrato e o briefing do seu projeto estão prontos — falta apenas sua assinatura e as respostas do briefing para darmos início ao trabalho.',
        EXPIRES_AT: dados.prazo, ACCESS_CODE: dados.codigo, PORTAL_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Assinar e responder briefing',
        PREHEADER: 'Seu contrato e briefing estão prontos.',
      } };

    case 'entregaDisponivel':
      return { template: 'actionRequired', blocks: { ACTION_DEADLINE_ROW: !!dados.prazo }, placeholders: {
        ACTION_CATEGORY: 'Entrega', ACTION_ICON_PATH: ACTION_ICONS.revisao,
        ACTION_HEADING: 'Seu material está<br>pronto para revisão.', CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        ACTION_DESCRIPTION: 'Os arquivos do seu projeto já estão disponíveis no portal — acesse para revisar e aprovar a entrega.',
        ACTION_STAGE: 'Entrega', ACTION_DEADLINE: dados.prazo, ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Revisar material',
        ACTION_FOOT_NOTE: 'Este material permanecerá disponível durante o período definido pelo profissional.',
        PREHEADER: 'Seu material está pronto para revisão.',
      } };

    case 'briefingPreenchido':
    case 'atualizacaoProjeto':
    case 'documentoDisponivel':
    case 'eventoAgendado': {
      const config = {
        briefingPreenchido: { cat: 'Briefing', head: 'O briefing foi<br>preenchido.', desc: 'O cliente concluiu o preenchimento do briefing. Acesse o portal para conferir as respostas.', stage: 'Briefing', cta: 'Ver briefing' },
        atualizacaoProjeto: { cat: 'Atualização', head: 'Há uma atualização<br>no seu projeto.', desc: dados.descricao || 'Há uma novidade no seu projeto.', stage: 'Atualização', cta: 'Ver atualização' },
        documentoDisponivel: { cat: 'Documento', head: 'Um novo documento<br>está disponível.', desc: 'Um novo documento foi adicionado ao seu projeto e já está disponível no portal.', stage: 'Documento', cta: 'Ver documento' },
        eventoAgendado: { cat: 'Agenda', head: 'Seu evento foi<br>agendado.', desc: 'O evento do seu projeto foi agendado. Confira os detalhes no portal.', stage: 'Agenda', cta: 'Ver evento' },
      }[tipo];
      return { template: 'actionRequired', blocks: { ACTION_DEADLINE_ROW: !!dados.prazo }, placeholders: {
        ACTION_CATEGORY: config.cat, ACTION_ICON_PATH: ACTION_ICONS.briefing,
        ACTION_HEADING: config.head, CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        ACTION_DESCRIPTION: config.desc, ACTION_STAGE: config.stage, ACTION_DEADLINE: dados.prazo,
        ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: config.cta,
        ACTION_FOOT_NOTE: 'Você pode acompanhar todo o andamento do projeto pelo portal a qualquer momento.',
        PREHEADER: config.head.replace(/<br>/g, ' '),
      } };
    }

    case 'pagamentoPendente':
      return { template: 'paymentReminder', blocks: { PAYMENT_METHOD_ROW: !!dados.metodo }, placeholders: {
        REMINDER_HEADING: 'Seu pagamento<br>vence hoje.', REMINDER_TIMING: 'vence hoje',
        CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '', PAYMENT_AMOUNT: dados.valor, DUE_DATE: dados.vencimento,
        PAYMENT_METHOD: dados.metodo, ACTION_URL: dados.ctaUrl,
        PREHEADER: 'Seu pagamento vence hoje.',
      } };

    case 'pagamentoRecebido':
      return { template: 'invoiceReceipt', blocks: { INVOICE_NUMBER_ROW: false, PAYMENT_METHOD_ROW: !!dados.metodo }, placeholders: {
        CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '', INVOICE_DATE: dados.data, PAYMENT_METHOD: dados.metodo,
        PAYMENT_AMOUNT: dados.valor, ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Ver no portal',
        PREHEADER: 'Confirmamos o recebimento do seu pagamento.',
      } };

    case 'entregaAprovada':
      return { template: 'accountNotification', blocks: { CTA_BLOCK: !!dados.ctaUrl }, placeholders: {
        USER_NAME: dados.nome, USER_EMAIL: dados.email, EVENT_TITLE: 'Entrega aprovada',
        EVENT_DESCRIPTION: 'O cliente aprovou a entrega do projeto ' + (dados.projeto || '') + '.', EVENT_TIME: dados.quando || '—',
        ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Ver projeto',
        PREHEADER: 'A entrega do projeto foi aprovada.',
      } };

    case 'projetoConcluido':
      return { template: 'actionRequired', blocks: { ACTION_DEADLINE_ROW: false }, placeholders: {
        ACTION_CATEGORY: 'Conclusão', ACTION_ICON_PATH: ACTION_ICONS.conclusao,
        ACTION_HEADING: 'Seu projeto foi<br>concluído.', CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        ACTION_DESCRIPTION: 'Agradecemos a confiança! Acesse o portal para conferir os arquivos finais e o histórico completo do projeto.',
        ACTION_STAGE: 'Concluído', ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Ver projeto',
        ACTION_FOOT_NOTE: 'O portal do projeto continua disponível para consulta a qualquer momento.',
        PREHEADER: 'Seu projeto foi concluído.',
      } };

    case 'avaliacaoSolicitada':
      return { template: 'actionRequired', blocks: { ACTION_DEADLINE_ROW: false }, placeholders: {
        ACTION_CATEGORY: 'Avaliação', ACTION_ICON_PATH: ACTION_ICONS.revisao,
        ACTION_HEADING: 'Conte-nos como foi<br>sua experiência.', CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        ACTION_DESCRIPTION: 'O projeto foi concluído — sua avaliação ajuda a melhorar cada vez mais o trabalho entregue.',
        ACTION_STAGE: 'Avaliação', ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Deixar avaliação',
        ACTION_FOOT_NOTE: 'Leva menos de um minuto.',
        PREHEADER: 'Conte-nos como foi sua experiência com o projeto.',
      } };

    case 'acaoNecessaria':
      return { template: 'actionRequired', blocks: { ACTION_DEADLINE_ROW: !!dados.prazo }, placeholders: {
        ACTION_CATEGORY: dados.categoria || 'Ação necessária', ACTION_ICON_PATH: ACTION_ICONS[dados.icone] || ACTION_ICONS.revisao,
        ACTION_HEADING: dados.titulo || 'O próximo passo<br>está com você.', CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        ACTION_DESCRIPTION: dados.descricao || '', ACTION_STAGE: dados.etapa || '', ACTION_DEADLINE: dados.prazo,
        ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: dados.ctaLabel || 'Resolver agora',
        ACTION_FOOT_NOTE: 'Este e-mail é reutilizável para qualquer pendência do projeto.',
        PREHEADER: dados.titulo ? dados.titulo.replace(/<br>/g, ' ') : 'Uma etapa do seu projeto aguarda sua ação.',
      } };

    // ===== Colaboradores (job-scoped, papel interno na equipa do trabalho) =====
    case 'colaboradorJobConvite':
      return { template: 'collabInviteNewUser', placeholders: {
        INVITER_NAME: dados.remetente, PROJECT_NAME: dados.projeto || '', ACCESS_CODE: dados.codigo, ACTION_URL: dados.ctaUrl,
        PREHEADER: (dados.remetente || 'Alguém') + ' convidou você para colaborar em um projeto no Pivots.',
      } };

    case 'colaboradorJobAdicionado':
      return { template: 'collabInviteExistingUser', placeholders: {
        INVITER_NAME: dados.remetente, PROJECT_NAME: dados.projeto || '', USER_EMAIL: dados.email, PORTAL_URL: dados.ctaUrl,
        PREHEADER: (dados.remetente || 'Alguém') + ' convidou você para colaborar em um projeto no Pivots.',
      } };

    case 'colaboradorContratoPronto':
      return { template: 'actionRequired', blocks: { ACTION_DEADLINE_ROW: false }, placeholders: {
        ACTION_CATEGORY: 'Contrato', ACTION_ICON_PATH: ACTION_ICONS.assinatura,
        ACTION_HEADING: 'Um contrato aguarda<br>sua assinatura.', CLIENT_NAME: dados.nome, PROJECT_NAME: dados.projeto || '',
        ACTION_DESCRIPTION: (dados.remetente || 'O responsável pelo projeto') + ' preparou um contrato para a sua colaboração em "' + (dados.projeto || '') + '".',
        ACTION_STAGE: 'Assinatura', ACTION_URL: dados.ctaUrl, ACTION_CTA_LABEL: 'Assinar contrato',
        ACTION_FOOT_NOTE: 'Este e-mail é sobre o contrato da sua colaboração neste projeto específico.',
        PREHEADER: 'Um contrato de colaboração aguarda sua assinatura.',
      } };

    default:
      return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Usa POST.' });
    return;
  }
  const { to, tipo, dados, subject: subjectOverride, html: htmlDireto } = req.body || {};
  if (!to) {
    res.status(400).json({ error: 'to é obrigatório.' });
    return;
  }

  let subject = subjectOverride;
  let html = htmlDireto;

  // Caminho novo: { to, tipo, dados } — o servidor escolhe o template certo.
  if (!html && tipo) {
    const montado = evento(tipo, dados);
    if (!montado) {
      res.status(400).json({ error: 'Tipo de evento de email desconhecido: ' + tipo });
      return;
    }
    html = renderTemplate(montado.template, Object.assign({ __blocks: montado.blocks }, montado.placeholders));
    if (!subject) subject = dados && dados.assunto ? dados.assunto : assuntoDoTemplate(montado.template);
  }

  if (!subject || !html) {
    res.status(400).json({ error: 'Não foi possível montar o email (subject/html em falta).' });
    return;
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to, reply_to: process.env.RESEND_REPLY_TO || 'contact@pivots.app', subject, html })
    });
    if (!r.ok) {
      res.status(500).json({ error: 'Resend falhou.', details: await r.text() });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado ao enviar.', details: String(err && err.message || err) });
  }
};
