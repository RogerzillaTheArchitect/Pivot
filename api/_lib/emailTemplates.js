/**
 * Motor genérico de templates de email — usado por todas as funções server-side
 * que enviam email (api/emails/send-event.js, api/auth/signup.js,
 * api/auth/resend.js, api/team/invite.js, api/cron/send-reminders.js).
 *
 * Os 12 templates reais (design entregue pelo utilizador) vivem em
 * /email-templates-v2/*.html, com placeholders {{CHAVE}} e blocos opcionais
 * marcados por <!--BLOCK:NOME-->...<!--/BLOCK:NOME--> (removidos inteiros
 * quando o campo correspondente não existe/não se aplica àquele envio —
 * ex.: código de acesso, prazo, forma de pagamento). Nenhum HTML/CSS dos
 * templates é gerado ou alterado por aqui — só substituição de conteúdo.
 */
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'email-templates-v2');

const TEMPLATES = {
  welcome: '01-welcome.html',
  emailVerification: '02-email-verification.html',
  passwordReset: '03-password-reset.html',
  portalReady: '04-portal-ready.html',
  invoiceReceipt: '05-invoice-receipt.html',
  accountNotification: '06-generic-account-notification.html',
  collabInviteNewUser: '07-collab-invite-new-user.html',
  collabInviteExistingUser: '08-collab-invite-existing-user.html',
  organizationInvite: '09-organization-invite.html',
  paymentReminder: '10-payment-reminder.html',
  paymentOverdue: '11-payment-overdue.html',
  actionRequired: '12-action-required.html',
};

// placeholders cujo valor é o próprio markup (SVG do ícone) — nunca escapar.
const RAW_KEYS = new Set(['ACTION_ICON_PATH']);

const cache = {};
function lerTemplate(templateId) {
  const fileName = TEMPLATES[templateId];
  if (!fileName) throw new Error('Template de email desconhecido: ' + templateId);
  if (!cache[fileName]) cache[fileName] = fs.readFileSync(path.join(TEMPLATES_DIR, fileName), 'utf8');
  return cache[fileName];
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function placeholdersPadrao() {
  const APP_URL = process.env.APP_URL || 'https://pivots.app';
  return {
    CURRENT_YEAR: String(new Date().getFullYear()),
    CONTACT_EMAIL: process.env.RESEND_REPLY_TO || 'contact@pivots.app',
    FAQ_URL: APP_URL + '/faq',
    HELP_URL: APP_URL + '/ajuda',
    TERMS_URL: APP_URL + '/termos',
    PRIVACY_URL: APP_URL + '/privacidade',
    UNSUBSCRIBE_URL: APP_URL + '/preferencias-email',
  };
}

/* remove (ou mantém, sem os marcadores) cada bloco <!--BLOCK:NOME-->...
   <!--/BLOCK:NOME--> conforme blocks[NOME] seja falso/verdadeiro. Blocos não
   mencionados em `blocks` ficam ocultos por padrão (nunca mostra um campo
   que o chamador não pediu explicitamente). */
function aplicarBlocosOpcionais(html, blocks) {
  blocks = blocks || {};
  return html.replace(/<!--BLOCK:(\w+)-->([\s\S]*?)<!--\/BLOCK:\1-->/g, (_, nome, conteudo) => (blocks[nome] ? conteudo : ''));
}

/**
 * renderTemplate(templateId, dados)
 *   dados: valores para {{PLACEHOLDER}} (mescla com os padrões globais —
 *   pode sobrescrever FAQ_URL etc. se precisar).
 *   dados.__blocks: { NOME_DO_BLOCO: true|false } — controla os blocos
 *   opcionais do template (ver marcadores BLOCK: em cada .html).
 */
function renderTemplate(templateId, dados) {
  dados = dados || {};
  let html = lerTemplate(templateId);
  html = aplicarBlocosOpcionais(html, dados.__blocks);
  const valores = Object.assign({}, placeholdersPadrao(), dados);
  html = html.replace(/\{\{(\w+)\}\}/g, (m, chave) => {
    const v = valores[chave];
    if (v == null) return '';
    return RAW_KEYS.has(chave) ? String(v) : escapeHtml(v);
  });
  return html;
}

function assuntoDoTemplate(templateId) {
  const html = lerTemplate(templateId);
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  return m ? m[1].trim() : 'Pivots';
}

module.exports = { TEMPLATES, renderTemplate, assuntoDoTemplate, escapeHtml };
