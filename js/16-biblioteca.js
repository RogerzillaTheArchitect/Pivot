/* Pivots — biblioteca
   Gerado pela modularizacao de index.html. Carregado por <script src> em
   ordem fixa; escopo global partilhado, tal como no script unico original.
   Codigo de arranque vive em js/99-boot.js. */

  /* 🧩 Modelo — Briefing / Checklist / Cronograma (lista simples) */
  let modeloListType='briefing';
  const modeloListCopy={
    briefing:{label:t('model.briefingName'), placeholder:t('model.briefingPlaceholder'), item:t('toast.addQuestion'),
      seed:['Local da cerimónia','Hora de início','Nº de convidados']},
    checklist:{label:t('model.checklistName'), placeholder:t('model.checklistPlaceholder'), item:t('toast.addItem'),
      seed:['Exportar galeria','Enviar link ao cliente','Confirmar receção']},
    cronograma:{label:t('model.scheduleName'), placeholder:t('model.schedulePlaceholder'), item:t('model.scheduleMilestone'),
      seed:['Assinatura','+3 dias — Sinal','[Evento]','+30 dias — Entrega']}
  };
  /* ===================== BIBLIOTECA UNIFICADA =====================
     Busca unificada sobre o catálogo da Biblioteca Jurídica oficial
     (LegalLibrary). "Coberturas" (quais blocos um contrato cobre, ex.:
     Pagamento/Cancelamento) dependia da composição BIBLIOTECA_BLOCOS, que
     não existe mais — até o gerador de blocos oficiais ficar pronto, este
     campo fica sempre vazio. */
  function bibCoberturasDoModelo(b){
    return [];
  }
  const BIB_FIELD_WORD_MAP={
    /* Bloco abaixo agrupado fora da ordem alfabética de propósito — vocabulário
       novo introduzido pelos contratos de Home & Trade Services (pintura,
       reforma, obras, limpeza, jardinagem, mudanças, faz-tudo). A ordem não
       importa para a busca (chave direta no objeto), só para leitura humana. */
    "ADDITIONS":{pt:"Ampliações",es:"Ampliaciones"},
    "BASEMENT":{pt:"Cave",es:"Sótano"},
    "BATHROOM":{pt:"Casa de Banho",es:"Baño"},
    "CARE":{pt:"Cuidado",es:"Cuidado"},
    "CLEANING":{pt:"Limpeza",es:"Limpieza"},
    "CONSTRUCTION":{pt:"Construção",es:"Construcción"},
    "DEEP":{pt:"Profunda",es:"Profunda"},
    "DISTANCE":{pt:"Distância",es:"Distancia"},
    "EXTERIOR":{pt:"Exterior",es:"Exterior"},
    "FACILITY":{pt:"Instalação",es:"Instalación"},
    "FINISHING":{pt:"Acabamento",es:"Acabado"},
    "FIXTURE":{pt:"Acessório",es:"Accesorio"},
    "GARDEN":{pt:"Jardim",es:"Jardín"},
    "HANDYMAN":{pt:"Faz-Tudo",es:"Manitas"},
    "HOME":{pt:"Casa",es:"Casa"},
    "HOUSE":{pt:"Casa",es:"Casa"},
    "IN":{pt:"Entrada",es:"Entrada"},
    "INTERIOR":{pt:"Interior",es:"Interior"},
    "JANITORIAL":{pt:"Conservação",es:"Conserjería"},
    "JOBS":{pt:"Trabalhos",es:"Trabajos"},
    "KITCHEN":{pt:"Cozinha",es:"Cocina"},
    "LANDSCAPE":{pt:"Paisagismo",es:"Paisajismo"},
    "LANDSCAPING":{pt:"Paisagismo",es:"Paisajismo"},
    "LAWN":{pt:"Relvado",es:"Césped"},
    "LOCAL":{pt:"Local",es:"Local"},
    "LONG":{pt:"Longa",es:"Larga"},
    "MINOR":{pt:"Menor",es:"Menor"},
    "MOVE":{pt:"Mudança",es:"Mudanza"},
    "MOVING":{pt:"Mudança",es:"Mudanza"},
    "NEW":{pt:"Nova",es:"Nueva"},
    "OFFICE":{pt:"Escritório",es:"Oficina"},
    "OUT":{pt:"Saída",es:"Salida"},
    "PACKING":{pt:"Embalagem",es:"Embalaje"},
    "PAINT":{pt:"Pintura",es:"Pintura"},
    "PAINTING":{pt:"Pintura",es:"Pintura"},
    "PROPERTIES":{pt:"Propriedades",es:"Propiedades"},
    "RECURRING":{pt:"Recorrente",es:"Recurrente"},
    "RELOCATION":{pt:"Mudança",es:"Mudanza"},
    "RENOVATION":{pt:"Renovação",es:"Renovación"},
    "REPAINTING":{pt:"Repintura",es:"Repintado"},
    "REPAIR":{pt:"Reparo",es:"Reparación"},
    "REPAIRS":{pt:"Reparos",es:"Reparaciones"},
    "RESIDENTIAL":{pt:"Residencial",es:"Residencial"},
    "RETAIL":{pt:"Retalho",es:"Minorista"},
    "ROOM":{pt:"Cómodo",es:"Habitación"},
    "SEASONAL":{pt:"Sazonal",es:"Estacional"},
    "SMALL":{pt:"Pequenos",es:"Pequeños"},
    "STORAGE":{pt:"Armazenamento",es:"Almacenamiento"},
    "STRUCTURAL":{pt:"Estrutural",es:"Estructural"},
    "WHOLE":{pt:"Inteira",es:"Entera"},
    "A":{pt:"Um",es:"Un"},
    "ACCEPTANCE":{pt:"Aceitação",es:"Aceptación"},
    "ACCESS":{pt:"Acesso",es:"Acceso"},
    "ACCOUNTING":{pt:"Contabilidade",es:"Contabilidad"},
    "ACCREDITATION":{pt:"Credenciamento",es:"Acreditación"},
    "ACTION":{pt:"Ação",es:"Acción"},
    "AD":{pt:"Anúncio",es:"Anuncio"},
    "ADDITIONAL":{pt:"Adicional",es:"Adicional"},
    "ADDRESS":{pt:"Endereço",es:"Dirección"},
    "AGENT":{pt:"Agente",es:"Agente"},
    "AGREEMENT":{pt:"Acordo",es:"Acuerdo"},
    "ALLOCATION":{pt:"Alocação",es:"Asignación"},
    "ALTITUDE":{pt:"Altitude",es:"Altitud"},
    "AMOUNT":{pt:"Valor",es:"Monto"},
    "ANALYTICS":{pt:"Análises",es:"Analítica"},
    "API":{pt:"API",es:"API"},
    "APPLICABLE":{pt:"Aplicável",es:"Aplicable"},
    "APPROVAL":{pt:"Aprovação",es:"Aprobación"},
    "ARCHITECTURE":{pt:"Arquitetura",es:"Arquitectura"},
    "ARCHIVAL":{pt:"Arquivo",es:"Archivo"},
    "AREAS":{pt:"Áreas",es:"Áreas"},
    "ASSESSMENT":{pt:"Avaliação",es:"Evaluación"},
    "ASSIGNEE":{pt:"Cessionário",es:"Cesionario"},
    "ASSIGNMENT":{pt:"Cessão",es:"Cesión"},
    "ASSIGNOR":{pt:"Cedente",es:"Cedente"},
    "ASSISTANCE":{pt:"Assistência",es:"Asistencia"},
    "ATTRIBUTION":{pt:"Atribuição",es:"Atribución"},
    "AUDIENCE":{pt:"Público",es:"Audiencia"},
    "AUDIT":{pt:"Auditoria",es:"Auditoría"},
    "AUTHENTICATION":{pt:"Autenticação",es:"Autenticación"},
    "AUTHORITY":{pt:"Autoridade",es:"Autoridad"},
    "AUTHORIZATION":{pt:"Autorização",es:"Autorización"},
    "B":{pt:"Dois",es:"Dos"},
    "BASE":{pt:"Base",es:"Base"},
    "BASELINE":{pt:"Linha de Base",es:"Línea Base"},
    "BILLING":{pt:"Faturação",es:"Facturación"},
    "BONUS":{pt:"Bónus",es:"Bono"},
    "BREACH":{pt:"Incumprimento",es:"Incumplimiento"},
    "BRIEF":{pt:"Briefing",es:"Brief"},
    "BROWSER":{pt:"Navegador",es:"Navegador"},
    "BUDGET":{pt:"Orçamento",es:"Presupuesto"},
    "BUSINESS":{pt:"Negócio",es:"Negocio"},
    "BY":{pt:"Por",es:"Por"},
    "CALENDAR":{pt:"Calendário",es:"Calendario"},
    "CAMPAIGN":{pt:"Campanha",es:"Campaña"},
    "CANCELLATION":{pt:"Cancelamento",es:"Cancelación"},
    "CANDIDATE":{pt:"Candidato",es:"Candidato"},
    "CAP":{pt:"Limite",es:"Límite"},
    "CATEGORY":{pt:"Categoria",es:"Categoría"},
    "CHANNELS":{pt:"Canais",es:"Canales"},
    "CHRONIC":{pt:"Crónico",es:"Crónico"},
    "CIRCUMVENTION":{pt:"Contornação",es:"Circunvención"},
    "CLIENT":{pt:"Cliente",es:"Cliente"},
    "CLIPS":{pt:"Clipes",es:"Clips"},
    "CLOUD":{pt:"Cloud",es:"Nube"},
    "COMMERCIAL":{pt:"Comercial",es:"Comercial"},
    "COMMISSION":{pt:"Comissão",es:"Comisión"},
    "COMMUNITY":{pt:"Comunidade",es:"Comunidad"},
    "COMPANY":{pt:"Empresa",es:"Empresa"},
    "COMPATIBILITY":{pt:"Compatibilidade",es:"Compatibilidad"},
    "COMPENSATION":{pt:"Remuneração",es:"Compensación"},
    "COMPETE":{pt:"Concorrer",es:"Competir"},
    "COMPETING":{pt:"Concorrente",es:"Competidor"},
    "CONFIDENTIALITY":{pt:"Confidencialidade",es:"Confidencialidad"},
    "CONSULTATION":{pt:"Consulta",es:"Consulta"},
    "CONSULTING":{pt:"Consultoria",es:"Consultoría"},
    "CONTACT":{pt:"Contacto",es:"Contacto"},
    "CONTENT":{pt:"Conteúdo",es:"Contenido"},
    "CONTRACTED":{pt:"Contratado",es:"Contratado"},
    "CONTRIBUTION":{pt:"Contribuição",es:"Contribución"},
    "CORRECTIVE":{pt:"Corretiva",es:"Correctiva"},
    "COUNT":{pt:"Contagem",es:"Cantidad"},
    "COURSE":{pt:"Curso",es:"Curso"},
    "COVERAGE":{pt:"Cobertura",es:"Cobertura"},
    "CRASH":{pt:"Falha",es:"Fallo"},
    "CREATIVE":{pt:"Criativo",es:"Creativo"},
    "CREDIT":{pt:"Crédito",es:"Crédito"},
    "CRITERIA":{pt:"Critérios",es:"Criterios"},
    "CRITICAL":{pt:"Crítico",es:"Crítico"},
    "CURE":{pt:"Correção",es:"Corrección"},
    "CURRICULUM":{pt:"Currículo",es:"Currículo"},
    "CUTOFF":{pt:"Corte",es:"Corte"},
    "DAMAGES":{pt:"Danos",es:"Daños"},
    "DATE":{pt:"Data",es:"Fecha"},
    "DATES":{pt:"Datas",es:"Fechas"},
    "DAYS":{pt:"Dias",es:"Días"},
    "DEADLINE":{pt:"Prazo",es:"Plazo"},
    "DEADLOCK":{pt:"Impasse",es:"Punto Muerto"},
    "DECISION":{pt:"Decisão",es:"Decisión"},
    "DECLINED":{pt:"Recusado",es:"Rechazado"},
    "DEFAULT":{pt:"Padrão",es:"Predeterminado"},
    "DEFINITION":{pt:"Definição",es:"Definición"},
    "DELIVERABLES":{pt:"Entregáveis",es:"Entregables"},
    "DELIVERY":{pt:"Entrega",es:"Entrega"},
    "DEPRECATION":{pt:"Descontinuação",es:"Obsolescencia"},
    "DESCRIPTION":{pt:"Descrição",es:"Descripción"},
    "DESIGN":{pt:"Design",es:"Diseño"},
    "DEVELOPER":{pt:"Programador",es:"Desarrollador"},
    "DEVELOPMENT":{pt:"Desenvolvimento",es:"Desarrollo"},
    "DEVICE":{pt:"Dispositivo",es:"Dispositivo"},
    "DIRECTION":{pt:"Direção",es:"Dirección"},
    "DISCLOSING":{pt:"Divulgador",es:"Divulgador"},
    "DISCLOSURE":{pt:"Divulgação",es:"Divulgación"},
    "DISPUTE":{pt:"Litígio",es:"Disputa"},
    "DOCUMENT":{pt:"Documento",es:"Documento"},
    "DOCUMENTATION":{pt:"Documentação",es:"Documentación"},
    "DOMAIN":{pt:"Domínio",es:"Dominio"},
    "DURATION":{pt:"Duração",es:"Duración"},
    "EARNING":{pt:"Rendimento",es:"Ganancia"},
    "EDITED":{pt:"Editado",es:"Editado"},
    "EDITORIAL":{pt:"Editorial",es:"Editorial"},
    "EFFECTIVE":{pt:"Efetivo",es:"Efectivo"},
    "EMERGENCY":{pt:"Emergência",es:"Emergencia"},
    "EMPLOYEES":{pt:"Funcionários",es:"Empleados"},
    "ENDPOINT":{pt:"Endpoint",es:"Endpoint"},
    "ESCALATION":{pt:"Escalonamento",es:"Escalamiento"},
    "ESTIMATED":{pt:"Estimado",es:"Estimado"},
    "EVENT":{pt:"Evento",es:"Evento"},
    "EXCLUDED":{pt:"Excluído",es:"Excluido"},
    "EXCLUSIVITY":{pt:"Exclusividade",es:"Exclusividad"},
    "EXPENSE":{pt:"Despesa",es:"Gasto"},
    "EXPRESS":{pt:"Expresso",es:"Exprés"},
    "EXTENDED":{pt:"Alargado",es:"Extendido"},
    "FAILURE":{pt:"Falha",es:"Fallo"},
    "FEE":{pt:"Taxa",es:"Tarifa"},
    "FILES":{pt:"Ficheiros",es:"Archivos"},
    "FILING":{pt:"Registo",es:"Registro"},
    "FINANCIAL":{pt:"Financeiro",es:"Financiero"},
    "FOLLOW":{pt:"Acompanhamento",es:"Seguimiento"},
    "FORCE":{pt:"Força",es:"Fuerza"},
    "FORMAT":{pt:"Formato",es:"Formato"},
    "FORMATTING":{pt:"Formatação",es:"Formato"},
    "FORMULA":{pt:"Fórmula",es:"Fórmula"},
    "FREQUENCY":{pt:"Frequência",es:"Frecuencia"},
    "FUTURE":{pt:"Futuro",es:"Futuro"},
    "GLOSSARY":{pt:"Glossário",es:"Glosario"},
    "GRAPHIC":{pt:"Gráfico",es:"Gráfico"},
    "GUARANTEE":{pt:"Garantia",es:"Garantía"},
    "HIGH":{pt:"Alto",es:"Alto"},
    "HIRING":{pt:"Contratação",es:"Contratación"},
    "HOLIDAYS":{pt:"Feriados",es:"Días Festivos"},
    "HOSTING":{pt:"Alojamento",es:"Alojamiento"},
    "HOUR":{pt:"Hora",es:"Hora"},
    "HOURLY":{pt:"Por Hora",es:"Por Hora"},
    "HOURS":{pt:"Horas",es:"Horas"},
    "IMAGE":{pt:"Imagem",es:"Imagen"},
    "IMAGES":{pt:"Imagens",es:"Imágenes"},
    "IMPLEMENTATION":{pt:"Implementação",es:"Implementación"},
    "INCIDENT":{pt:"Incidente",es:"Incidente"},
    "INCLUDED":{pt:"Incluído",es:"Incluido"},
    "INDEMNITY":{pt:"Indemnização",es:"Indemnización"},
    "INFRASTRUCTURE":{pt:"Infraestrutura",es:"Infraestructura"},
    "INSPECTION":{pt:"Inspeção",es:"Inspección"},
    "INSTALLATION":{pt:"Instalação",es:"Instalación"},
    "INSURANCE":{pt:"Seguro",es:"Seguro"},
    "INTEREST":{pt:"Juros",es:"Interés"},
    "INVESTMENT":{pt:"Investimento",es:"Inversión"},
    "IP":{pt:"PI",es:"PI"},
    "JOINT":{pt:"Conjunto",es:"Conjunto"},
    "KEYWORD":{pt:"Palavra-chave",es:"Palabra Clave"},
    "LANDING":{pt:"Landing",es:"Landing"},
    "LANGUAGE":{pt:"Idioma",es:"Idioma"},
    "LANGUAGES":{pt:"Idiomas",es:"Idiomas"},
    "LATE":{pt:"Atraso",es:"Retraso"},
    "LAW":{pt:"Lei",es:"Ley"},
    "LEGITIMATE":{pt:"Legítimo",es:"Legítimo"},
    "LEVELS":{pt:"Níveis",es:"Niveles"},
    "LIABILITY":{pt:"Responsabilidade",es:"Responsabilidad"},
    "LICENSE":{pt:"Licença",es:"Licencia"},
    "LICENSED":{pt:"Licenciado",es:"Licenciado"},
    "LICENSEE":{pt:"Licenciado",es:"Licenciatario"},
    "LICENSOR":{pt:"Licenciante",es:"Licenciante"},
    "LIQUIDATED":{pt:"Pré-fixados",es:"Liquidados"},
    "LIST":{pt:"Lista",es:"Lista"},
    "LOCATION":{pt:"Local",es:"Lugar"},
    "LOOKBACK":{pt:"Retroativo",es:"Retroactivo"},
    "LOW":{pt:"Baixo",es:"Bajo"},
    "MAINTENANCE":{pt:"Manutenção",es:"Mantenimiento"},
    "MAJEURE":{pt:"Maior",es:"Mayor"},
    "MAKING":{pt:"Tomada",es:"Toma"},
    "MANAGEMENT":{pt:"Gestão",es:"Gestión"},
    "MATERIAL":{pt:"Material",es:"Material"},
    "MATERIALS":{pt:"Materiais",es:"Materiales"},
    "MATRIX":{pt:"Matriz",es:"Matriz"},
    "MATTER":{pt:"Assunto",es:"Asunto"},
    "MAX":{pt:"Máximo",es:"Máximo"},
    "MEASUREMENT":{pt:"Medição",es:"Medición"},
    "MEASURES":{pt:"Medidas",es:"Medidas"},
    "MECHANISM":{pt:"Mecanismo",es:"Mecanismo"},
    "MEDIA":{pt:"Media",es:"Medios"},
    "MEDIUM":{pt:"Médio",es:"Medio"},
    "MEETING":{pt:"Reunião",es:"Reunión"},
    "MEETINGS":{pt:"Reuniões",es:"Reuniones"},
    "METHOD":{pt:"Método",es:"Método"},
    "METHODOLOGY":{pt:"Metodologia",es:"Metodología"},
    "METHODS":{pt:"Métodos",es:"Métodos"},
    "METRIC":{pt:"Métrica",es:"Métrica"},
    "METRICS":{pt:"Métricas",es:"Métricas"},
    "MILESTONE":{pt:"Marco",es:"Hito"},
    "MINIMUM":{pt:"Mínimo",es:"Mínimo"},
    "MODEL":{pt:"Modelo",es:"Modelo"},
    "MONITORING":{pt:"Monitorização",es:"Monitoreo"},
    "MONTHS":{pt:"Meses",es:"Meses"},
    "MUNICIPAL":{pt:"Municipal",es:"Municipal"},
    "MUSICIAN":{pt:"Músico",es:"Músico"},
    "NAME":{pt:"Nome",es:"Nombre"},
    "NON":{pt:"Não",es:"No"},
    "NOTICE":{pt:"Aviso",es:"Aviso"},
    "NOTIFICATION":{pt:"Notificação",es:"Notificación"},
    "NUMBER":{pt:"Número",es:"Número"},
    "OBJECTIVE":{pt:"Objetivo",es:"Objetivo"},
    "OF":{pt:"De",es:"De"},
    "ONLINE":{pt:"Online",es:"En Línea"},
    "ONSITE":{pt:"No Local",es:"En Sitio"},
    "OPERATION":{pt:"Operação",es:"Operación"},
    "OS":{pt:"SO",es:"SO"},
    "OVER":{pt:"Acima",es:"Sobre"},
    "OVERTIME":{pt:"Horas Extra",es:"Horas Extra"},
    "OWNERSHIP":{pt:"Propriedade",es:"Propiedad"},
    "PAGE":{pt:"Página",es:"Página"},
    "PAGES":{pt:"Páginas",es:"Páginas"},
    "PAID":{pt:"Pago",es:"Pagado"},
    "PARTICIPANT":{pt:"Participante",es:"Participante"},
    "PARTICIPANTS":{pt:"Participantes",es:"Participantes"},
    "PARTNER":{pt:"Parceiro",es:"Socio"},
    "PARTNERSHIP":{pt:"Parceria",es:"Asociación"},
    "PARTY":{pt:"Parte",es:"Parte"},
    "PASSIVE":{pt:"Passivo",es:"Pasivo"},
    "PAYMENT":{pt:"Pagamento",es:"Pago"},
    "PAYROLL":{pt:"Folha Salarial",es:"Nómina"},
    "PER":{pt:"Por",es:"Por"},
    "PERCENT":{pt:"Percentagem",es:"Porcentaje"},
    "PERFORMANCE":{pt:"Desempenho",es:"Desempeño"},
    "PERIOD":{pt:"Período",es:"Período"},
    "PERMITTED":{pt:"Permitido",es:"Permitido"},
    "PHASES":{pt:"Fases",es:"Fases"},
    "PHOTOGRAPHY":{pt:"Fotografia",es:"Fotografía"},
    "PIECES":{pt:"Peças",es:"Piezas"},
    "PLANNING":{pt:"Planeamento",es:"Planificación"},
    "PLATFORM":{pt:"Plataforma",es:"Plataforma"},
    "PLATFORMS":{pt:"Plataformas",es:"Plataformas"},
    "PODCAST":{pt:"Podcast",es:"Podcast"},
    "PORTFOLIO":{pt:"Portefólio",es:"Portafolio"},
    "POSITION":{pt:"Posição",es:"Posición"},
    "POSTING":{pt:"Publicação",es:"Publicación"},
    "POSTS":{pt:"Publicações",es:"Publicaciones"},
    "PRESENTATION":{pt:"Apresentação",es:"Presentación"},
    "PRICE":{pt:"Preço",es:"Precio"},
    "PRIORITY":{pt:"Prioridade",es:"Prioridad"},
    "PRODUCT":{pt:"Produto",es:"Producto"},
    "PRODUCTION":{pt:"Produção",es:"Producción"},
    "PROFESSIONAL":{pt:"Profissional",es:"Profesional"},
    "PROGRAM":{pt:"Programa",es:"Programa"},
    "PROGRESS":{pt:"Progresso",es:"Progreso"},
    "PROJECT":{pt:"Projeto",es:"Proyecto"},
    "PROPERTY":{pt:"Propriedade",es:"Propiedad"},
    "PROTOTYPE":{pt:"Protótipo",es:"Prototipo"},
    "PROVIDER":{pt:"Prestador",es:"Proveedor"},
    "PROVISION":{pt:"Disposição",es:"Disposición"},
    "PUBLIC":{pt:"Público",es:"Público"},
    "PUBLISHING":{pt:"Publicação",es:"Publicación"},
    "PURPOSE":{pt:"Finalidade",es:"Propósito"},
    "QA":{pt:"QA",es:"QA"},
    "RATE":{pt:"Taxa",es:"Tarifa"},
    "RECEIVING":{pt:"Recetor",es:"Receptor"},
    "RECORD":{pt:"Registo",es:"Registro"},
    "RECORDING":{pt:"Gravação",es:"Grabación"},
    "RECRUITMENT":{pt:"Recrutamento",es:"Reclutamiento"},
    "REFERENCE":{pt:"Referência",es:"Referencia"},
    "REGISTRATION":{pt:"Registo",es:"Registro"},
    "REINSPECTION":{pt:"Reinspeção",es:"Reinspección"},
    "RELEASE":{pt:"Liberação",es:"Liberación"},
    "RENDERING":{pt:"Renderização",es:"Renderizado"},
    "RENDERINGS":{pt:"Renderizações",es:"Renderizados"},
    "RENEWAL":{pt:"Renovação",es:"Renovación"},
    "RENTAL":{pt:"Aluguer",es:"Alquiler"},
    "REPORT":{pt:"Relatório",es:"Informe"},
    "REPORTING":{pt:"Relatórios",es:"Informes"},
    "REPRESENTATION":{pt:"Representação",es:"Representación"},
    "REQUIREMENTS":{pt:"Requisitos",es:"Requisitos"},
    "RESALE":{pt:"Revenda",es:"Reventa"},
    "RESCHEDULING":{pt:"Reagendamento",es:"Reprogramación"},
    "RESEARCH":{pt:"Pesquisa",es:"Investigación"},
    "RESELLER":{pt:"Revendedor",es:"Revendedor"},
    "RESOLUTION":{pt:"Resolução",es:"Resolución"},
    "RESPONSE":{pt:"Resposta",es:"Respuesta"},
    "RESPONSIBILITY":{pt:"Responsabilidade",es:"Responsabilidad"},
    "RESTRICTED":{pt:"Restrito",es:"Restringido"},
    "RESTRICTION":{pt:"Restrição",es:"Restricción"},
    "RETENTION":{pt:"Retenção",es:"Retención"},
    "RETURN":{pt:"Devolução",es:"Devolución"},
    "REVENUE":{pt:"Receita",es:"Ingreso"},
    "REVIEW":{pt:"Revisão",es:"Revisión"},
    "REVISION":{pt:"Revisão",es:"Revisión"},
    "ROLE":{pt:"Função",es:"Rol"},
    "ROUNDS":{pt:"Rondas",es:"Rondas"},
    "ROYALTY":{pt:"Royalty",es:"Regalía"},
    "RUSH":{pt:"Urgente",es:"Urgente"},
    "SALES":{pt:"Vendas",es:"Ventas"},
    "SCHEDULE":{pt:"Cronograma",es:"Cronograma"},
    "SCHEME":{pt:"Esquema",es:"Esquema"},
    "SCOPE":{pt:"Âmbito",es:"Alcance"},
    "SCREEN":{pt:"Ecrã",es:"Pantalla"},
    "SCREENS":{pt:"Ecrãs",es:"Pantallas"},
    "SECOND":{pt:"Segundo",es:"Segundo"},
    "SECURITY":{pt:"Segurança",es:"Seguridad"},
    "SEO":{pt:"SEO",es:"SEO"},
    "SERVICE":{pt:"Serviço",es:"Servicio"},
    "SERVICES":{pt:"Serviços",es:"Servicios"},
    "SESSION":{pt:"Sessão",es:"Sesión"},
    "SESSIONS":{pt:"Sessões",es:"Sesiones"},
    "SHARING":{pt:"Partilha",es:"Reparto"},
    "SHOOT":{pt:"Sessão de Fotos",es:"Sesión de Fotos"},
    "SIGNATURE":{pt:"Assinatura",es:"Firma"},
    "SITE":{pt:"Local",es:"Sitio"},
    "SLA":{pt:"SLA",es:"SLA"},
    "SOCIAL":{pt:"Social",es:"Social"},
    "SOFTWARE":{pt:"Software",es:"Software"},
    "SOLICITATION":{pt:"Aliciamento",es:"Solicitación"},
    "SONG":{pt:"Música",es:"Canción"},
    "SOURCE":{pt:"Origem",es:"Origen"},
    "SPEND":{pt:"Gasto",es:"Gasto"},
    "STACK":{pt:"Stack",es:"Stack"},
    "START":{pt:"Início",es:"Inicio"},
    "STATUS":{pt:"Estado",es:"Estado"},
    "STUDIO":{pt:"Estúdio",es:"Estudio"},
    "SUBJECT":{pt:"Assunto",es:"Asunto"},
    "SUBMISSION":{pt:"Submissão",es:"Envío"},
    "SUBTITLE":{pt:"Legenda",es:"Subtítulo"},
    "SUPERVISION":{pt:"Supervisão",es:"Supervisión"},
    "SUPPLIER":{pt:"Fornecedor",es:"Proveedor"},
    "SUPPORT":{pt:"Suporte",es:"Soporte"},
    "SURVIVAL":{pt:"Sobrevivência",es:"Supervivencia"},
    "SYSTEM":{pt:"Sistema",es:"Sistema"},
    "TAIL":{pt:"Cauda",es:"Cola"},
    "TALENT":{pt:"Talento",es:"Talento"},
    "TARGET":{pt:"Alvo",es:"Objetivo"},
    "TAX":{pt:"Imposto",es:"Impuesto"},
    "TECHNICAL":{pt:"Técnico",es:"Técnico"},
    "TECHNOLOGY":{pt:"Tecnologia",es:"Tecnología"},
    "TERM":{pt:"Prazo",es:"Plazo"},
    "TERMINATION":{pt:"Rescisão",es:"Rescisión"},
    "TERMS":{pt:"Termos",es:"Términos"},
    "TERRITORY":{pt:"Território",es:"Territorio"},
    "TEST":{pt:"Teste",es:"Prueba"},
    "THRESHOLD":{pt:"Limiar",es:"Umbral"},
    "TIME":{pt:"Tempo",es:"Tiempo"},
    "TIMELINE":{pt:"Cronograma",es:"Cronograma"},
    "TITLE":{pt:"Título",es:"Título"},
    "TOOL":{pt:"Ferramenta",es:"Herramienta"},
    "TOOLS":{pt:"Ferramentas",es:"Herramientas"},
    "TOPIC":{pt:"Tópico",es:"Tema"},
    "TOTAL":{pt:"Total",es:"Total"},
    "TOUR":{pt:"Tour",es:"Tour"},
    "TRACKED":{pt:"Rastreado",es:"Rastreado"},
    "TRACKING":{pt:"Rastreamento",es:"Seguimiento"},
    "TRAINING":{pt:"Formação",es:"Capacitación"},
    "TRANSACTION":{pt:"Transação",es:"Transacción"},
    "TRANSCRIPTION":{pt:"Transcrição",es:"Transcripción"},
    "TRANSLATION":{pt:"Tradução",es:"Traducción"},
    "TRIGGER":{pt:"Gatilho",es:"Disparador"},
    "TURNAROUND":{pt:"Prazo de Entrega",es:"Tiempo de Entrega"},
    "TYPE":{pt:"Tipo",es:"Tipo"},
    "UP":{pt:"Acima",es:"Arriba"},
    "UPTIME":{pt:"Disponibilidade",es:"Tiempo Activo"},
    "URGENT":{pt:"Urgente",es:"Urgente"},
    "URL":{pt:"URL",es:"URL"},
    "USAGE":{pt:"Uso",es:"Uso"},
    "USE":{pt:"Uso",es:"Uso"},
    "USERS":{pt:"Utilizadores",es:"Usuarios"},
    "VALUE":{pt:"Valor",es:"Valor"},
    "VERSION":{pt:"Versão",es:"Versión"},
    "VERSIONING":{pt:"Versionamento",es:"Versionado"},
    "VERSIONS":{pt:"Versões",es:"Versiones"},
    "VFX":{pt:"VFX",es:"VFX"},
    "VIDEO":{pt:"Vídeo",es:"Vídeo"},
    "VIDEOGRAPHER":{pt:"Videógrafo",es:"Videógrafo"},
    "VIDEOS":{pt:"Vídeos",es:"Vídeos"},
    "VIRTUAL":{pt:"Virtual",es:"Virtual"},
    "VISIT":{pt:"Visita",es:"Visita"},
    "VOICE":{pt:"Voz",es:"Voz"},
    "VOLUME":{pt:"Volume",es:"Volumen"},
    "VOTING":{pt:"Votação",es:"Votación"},
    "WAIVED":{pt:"Renunciado",es:"Renunciado"},
    "WARRANTY":{pt:"Garantia",es:"Garantía"},
    "WEBSITE":{pt:"Website",es:"Sitio Web"},
    "WEIGHT":{pt:"Peso",es:"Peso"},
    "WHOLESALE":{pt:"Atacado",es:"Mayorista"},
    "WINDOW":{pt:"Janela",es:"Ventana"},
    "WORK":{pt:"Trabalho",es:"Trabajo"},
    "WORKING":{pt:"Trabalho",es:"Trabajo"},
    "WORKS":{pt:"Obras",es:"Obras"},
    "WORKSHOP":{pt:"Workshop",es:"Taller"},
    "YEARS":{pt:"Anos",es:"Años"}
  };
  function bibCapitalizar(s){
    return (s||'').replace(/[_-]/g,' ').split(' ').filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  }
  /* Tradução palavra-a-palavra (fallback abaixo) não reordena adjetivo/
     substantivo — "Interior Painting" virava "Interior Pintura" em vez de
     "Pintura Interior". Continua em uma única língua (o objetivo principal),
     mas para as tags dos 8 contratos de Home & Trade Services — que
     conhecemos exatamente, por serem obra desta mesma sessão — vale a pena
     uma tradução completa e natural da frase, não só palavra por palavra. */
  function bibTraduzirCampo(campo){
    if(LANG==='en') return bibCapitalizar(campo);
    const palavras=(campo||'').split(/[_-]+/).filter(Boolean);
    return palavras.map(w=>{
      const m=BIB_FIELD_WORD_MAP[w.toUpperCase()];
      const tr = m ? (m[LANG]||m.pt) : (w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());
      return tr;
    }).join(' ');
  }
  /* item.idioma é um array (['en','pt','es', ...]) — todo contrato tem o
     Master English (PLDS-001) e pode ter traduções em legal-library/i18n/.
     O mapa cobre os 3 idiomas do app; qualquer outro aparece com o próprio
     código. */
  const BIB_IDIOMA_NOMES={en:'English', pt:'Português', es:'Español'};
  function bibNomeIdioma(code){ return BIB_IDIOMA_NOMES[code] || code; }
  const BIB_CATEGORIA_AMIGAVEL={
    'Photography':{pt:'Audiovisual', en:'Audiovisual', es:'Audiovisual'},
    'Videography':{pt:'Audiovisual', en:'Audiovisual', es:'Audiovisual'},
    'Design':{pt:'Design', en:'Design', es:'Diseño'},
    'Software Development':{pt:'Tecnologia', en:'Technology', es:'Tecnología'},
    'Marketing':{pt:'Marketing', en:'Marketing', es:'Marketing'},
    'Consulting':{pt:'Consultoria', en:'Consulting', es:'Consultoría'},
    'Architecture & Engineering':{pt:'Arquitetura & Engenharia', en:'Architecture & Engineering', es:'Arquitectura e Ingeniería'},
    'Education & Content':{pt:'Educação & Conteúdo', en:'Education & Content', es:'Educación y Contenido'},
    'Universal Contracts':{pt:'Geral', en:'General', es:'General'}
  };
  function bibCategoriaAmigavel(it){ const m=BIB_CATEGORIA_AMIGAVEL[it.categoria]; return m ? (m[LANG]||m.en) : it.categoria; }
  function bibProfissao(it){
    const s=((it.categoria||'')+' '+((it.tags||[]).join(' '))).toLowerCase();
    if(/video|drone|aftermovie/.test(s)) return 'Videomaker';
    if(/wedding/.test(s)) return 'Wedding planner';
    if(/design/.test(s)) return 'Designer';
    if(/photo/.test(s)) return 'Fotógrafo';
    return null;
  }
  function bibContexto(it){
    const s=((it.categoria||'')+' '+((it.tags||[]).join(' '))).toLowerCase();
    if(/consult|coaching|mentorship/.test(s)) return 'Consultoria';
    if(/wedding|event/.test(s)) return 'Eventos';
    if(/real estate|architect/.test(s)) return 'Imobiliário';
    if(/video|photo|drone|design/.test(s)) return 'Produção de Conteúdo';
    return 'Prestação de Serviços';
  }
  /* Sem cache: LegalLibrary carrega de forma assíncrona (fetch), então um
     cache module-level calculado antes do fetch terminar ficaria preso
     vazio para sempre. O catálogo tem no máximo algumas dezenas de itens —
     recalcular a cada chamada é barato. */
  /* Cada contrato oficial vira um card por idioma disponível (en + pt/es
     quando há tradução), com título/descrição no idioma correspondente —
     assim um prestador do Brasil acha um contrato em espanhol só pesquisando,
     sem depender de trocar o idioma do app. Favoritos são por contrato
     (baseId), não por variação de idioma. */
  function catalogoBiblioteca(){
    const out=[];
    LegalLibrary.list().forEach(b=>{
      const langs=(b.idioma&&b.idioma.length)?b.idioma:['en'];
      const base={
        baseId:'of:'+b.id, rawId:b.id,
        categoria:b.categoria, subcategoria:b.subcategoria, tags:b.tags||[],
        origem:b.origem, verificado:b.verificado, texto:b.texto, blocks:b.blocks||[],
        idioma:b.idioma, profissao:bibProfissao(b),
        numBlocos:b.numBlocos, coberturas:bibCoberturasDoModelo(b),
        /* Avaliação própria do utilizador (avaliarModelo/avaliacoesUtilizador,
           1-5 estrelas) — sem isto "avaliacao" nunca existia em nenhum item e
           o filtro Recomendados (>=4.7) nunca encontrava nada. */
        avaliacao: avaliacoesUtilizador[b.id]||0
      };
      base.categoriaAmigavel=bibCategoriaAmigavel(base);
      base.contexto=bibContexto(base);
      /* Tags de busca/identificação combinam as tags reais do contrato com
         facetas já calculadas (categoria amigável, subcategoria, segmento,
         contexto) — sem isto o contrato só era achável pelas poucas tags
         brutas do catálogo, insuficiente pra busca e pra identificar o
         contrato "em mais âmbitos" como pedido. */
      base.tagsBusca=[...new Set([
        ...(base.tags||[]),
        base.categoriaAmigavel, base.subcategoria, base.profissao, base.contexto
      ].filter(Boolean))];
      langs.forEach(lang=>{
        out.push(Object.assign({}, base, {
          id:'of:'+b.id+'@'+lang,
          lang,
          titulo: LegalLibrary.tituloEm(b, lang),
          desc: LegalLibrary.descEm(b, lang),
          tags: LegalLibrary.tagsEm(b, lang)
        }));
      });
    });
    return out;
  }
  const BIB_LANG_TAG={ en:'EN', pt:'PT', es:'ES' };
  /* miniatura na legenda de contagem de blocos ("N blocos") — mesmo ícone em
     toda a Biblioteca (card, detalhe, Meus Modelos), nunca outro glifo pro
     mesmo conceito. */
  const BIB_ICON_BLOCKS='<span class="nav-ico bc-lang-blocks-ico" style="display:inline-block;mask-image:url(https://api.iconify.design/hugeicons:blockchain-01.svg);-webkit-mask-image:url(https://api.iconify.design/hugeicons:blockchain-01.svg)"></span>';
  /* Ícones "sharp mid-century": traço reto (miter/square), sem curvas
     desnecessárias — usados nos botões Visualizar (olho) e Importar (seta)
     e nas etiquetas obrigatório/opcional/condicional da estrutura, no lugar
     dos "·" genéricos. */
  const BIB_ICON_EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><rect x="9.5" y="9.5" width="5" height="5"/></svg>';
  const BIB_ICON_ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"><path d="M4 12h16M13 5l7 7-7 7"/></svg>';
  const BIB_ICON_REQUIRED='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><rect x="4.5" y="11" width="15" height="9"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  const BIB_ICON_OPTIONAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="7" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg>';
  const BIB_ICON_CONDITIONAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M8 3v7l4 3 4-3V3"/><path d="M12 13v8"/></svg>';
  /* Ícones da biblioteca — Lucide, stroke 1.75, nunca preenchidos.
     Um único desenho por conceito, reaproveitado em toda a biblioteca
     (filtro, rodapé do card, sheet de detalhe, Visualizar). */
  const OTAG_ICON={
    /* Escudo preenchido (prata, via currentColor) com o check em espaço
       negativo — o "buraco" é uma máscara, não um traço por cima, pra ler
       como um recorte no metal do escudo, não como um ícone de check
       genérico ao lado do nome. */
    oficial:'<svg viewBox="0 0 24 24" fill="none"><mask id="pivotShieldCut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><path d="M8.5 12.4 11 14.9l4.5-5" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></mask><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" fill="currentColor" mask="url(#pivotShieldCut)"/></svg>',
    juridico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
    recomendados:'<span class="nav-ico" style="width:14px;height:14px;display:inline-block;mask-image:url(https://api.iconify.design/material-symbols-light:thumb-up-sharp.svg);-webkit-mask-image:url(https://api.iconify.design/material-symbols-light:thumb-up-sharp.svg)"></span>',
    comunidade:'<span class="nav-ico" style="width:14px;height:14px;display:inline-block;mask-image:url(https://api.iconify.design/ic:round-people-alt.svg);-webkit-mask-image:url(https://api.iconify.design/ic:round-people-alt.svg)"></span>'
  };
  function bibOtag(key, label){
    return '<span class="bib-seal s-'+key+'"><span class="sl-ic">'+OTAG_ICON[key]+'</span>'+
      '<span class="sl-lbl">'+escapeHtml(label)+'</span></span>';
  }
  let bibOrigemSel=new Set();
  let bibOrdenacao='usos';
  let bibIdiomaSel=null;
  let bibCategoriaSel=null;
  let bibSegmentoSel=null;
  /* "Modo de seleção" da Biblioteca — setado antes de navegar pra cá quando
     alguém precisa ESCOLHER um contrato pra usar noutro lugar (ex.: anexar
     a um colaborador), em vez de só navegar/gerenciar a biblioteca. Quando
     setado, o botão Importar do detalhe (abrirDetalheBibliotecaPrincipal)
     volta pro destino certo em vez do fluxo padrão de criação de trabalho. */
  let bibPickModeCallback=null;
  let bibFavoritos=new Set();
  function saveBibFavoritos(){ savePersisted('pivot-bibFavoritos', ()=>[...bibFavoritos]); }
  async function loadBibFavoritos(){ await loadPersisted('pivot-bibFavoritos', d=>{ bibFavoritos=new Set(d||[]); }); }
  /* Origem: as 4 insígnias — o filtro Jurídico continua a existir (é uma
     função real do sistema, pra quando houver revisão jurídica de verdade),
     só não aparece em NENHUM card individual hoje (ver bibAutorLinha) porque
     nenhum modelo foi ainda validado por um jurista — são todos gerados por
     IA. O filtro em si simplesmente devolve zero resultados até isso mudar,
     o que é o comportamento correto, não um bug. */
  const BIB_ORIGENS=[
    {key:'oficial', labelKey:'library.origin.official', labelKeyShort:'library.origin.officialShort'},
    {key:'juridico', labelKey:'library.origin.legal'},
    {key:'recomendados', labelKey:'library.origin.recommended', labelKeyShort:'library.origin.recommendedShort'},
    {key:'comunidade', labelKey:'library.origin.community', labelKeyShort:'library.origin.communityShort'}
  ];
  function toggleBibOrigem(org){
    if(bibOrigemSel.has(org)) bibOrigemSel.delete(org); else bibOrigemSel.add(org);
    renderBiblioteca();
  }
  const BIB_ORDENACOES=[
    ['usos','library.sort.mostUsed'],
    ['recomendados','library.sort.mostRecommended'],
    ['az','library.sort.az']
  ];
  function bibValoresIdioma(itens){
    const vals=new Set();
    itens.forEach(i=>(i.idioma||[]).forEach(x=>{ if(x) vals.add(x); }));
    return [...vals].sort();
  }
  function bibItemBateOrigem(item, org){
    if(org==='recomendados') return (item.avaliacao||0)>=4.7;
    if(org==='juridico') return !!item.verificado;
    return item.origem===org;
  }
  /* Aplica só os filtros de origem (usado pela contagem das insígnias e como
     base dos demais filtros). Dedupe por contrato fica a cargo de quem conta. */
  function bibItensFiltradosPorOrigem(){
    const todos=catalogoBiblioteca();
    if(bibOrigemSel.size===0) return todos;
    return todos.filter(i=>[...bibOrigemSel].some(org=>bibItemBateOrigem(i,org)));
  }
  /* Ícones dos filtros da Biblioteca — um glifo por conceito, nunca texto
     sozinho. iconHtml já vem embrulhado (svg completo ou o box de 2 letras
     do idioma via bibIdiomaIconHtml), pra esta função não ter que adivinhar
     o tipo de ícone de cada filtro. */
  function bibOptRowHtml(onclickAttr, label, on, iconHtml){
    const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>';
    return '<div class="bib-sort-opt'+(on?' on':'')+'" onclick="'+onclickAttr+'">'+
      '<span class="opt-left">'+(iconHtml?'<span class="opt-icon">'+iconHtml+'</span>':'')+'<span>'+escapeHtml(label)+'</span></span>'+
      '<span class="opt-check">'+check+'</span></div>';
  }
  const BIB_ICON_GLOBE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 4 6.4 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6.4-4-9s1.5-6.3 4-9Z"/></svg>';
  function bibIdiomaIconHtml(code){
    if(!code) return BIB_ICON_GLOBE;
    return '<span class="opt-lang-box">'+(BIB_LANG_TAG[code]||String(code).toUpperCase())+'</span>';
  }
  const BIB_ICON_SORT_USOS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>';
  const BIB_ICON_SORT_REC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2.5l2.7 5.8 6.3.6-4.8 4.3 1.4 6.2L12 16.2 6.4 19.4l1.4-6.2-4.8-4.3 6.3-.6Z"/></svg>';
  const BIB_ICON_SORT_AZ='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 6h16M4 12h10M4 18h6"/></svg>';
  const BIB_ICON_ALL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg>';
  const BIB_ICON_SEGMENTO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
  /* Ícone de categoria: reaproveita BIB_CATEGORIA_ICONS (o mesmo usado nas
     abas de categoria da Biblioteca antiga) por Market cru — como a
     categoria amigável agrupa vários Markets (ex.: Photography+Videography
     → "Audiovisual"), acha o primeiro item do catálogo com essa categoria
     amigável e usa o ícone do Market real dele, em vez de manter um segundo
     mapa duplicado que poderia desalinhar do original. */
  function bibIconeCategoriaAmigavel(catAmigavel){
    if(!catAmigavel) return BIB_ICON_ALL;
    const item=catalogoBiblioteca().find(i=>i.categoriaAmigavel===catAmigavel);
    const path=(item && BIB_CATEGORIA_ICONS[item.categoria]) || BIB_CATEGORIA_ICONS['Outros'];
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">'+path+'</svg>';
  }
  /* Sheet genérico de opção única (idioma, ordenar, categoria, segmento). */
  function bibSheetOpcaoUnica(titulo, opcoes, atual, onPick){
    window[onPick.name]=onPick;
    const rows=opcoes.map(o=>
      bibOptRowHtml(onPick.name+'('+(o.value===null?'null':'\''+String(o.value).replace(/'/g,"\\'")+'\'')+')', o.label, o.value===atual, o.icon)
    ).join('');
    openInfo(titulo, '<div class="bib-sort-row">'+rows+'</div>');
  }
  function abrirIdiomaBiblioteca(){
    const valores=bibValoresIdioma(catalogoBiblioteca());
    const opcoes=[{value:null,label:t('library.origin.all'),icon:BIB_ICON_GLOBE}].concat(valores.map(v=>({value:v,label:bibNomeIdioma(v),icon:bibIdiomaIconHtml(v)})));
    bibSheetOpcaoUnica(t('library.facet.language'), opcoes, bibIdiomaSel, function setBibIdiomaPick(v){ bibIdiomaSel=v; renderBiblioteca(); closeInfo(); });
  }
  const BIB_ORDENACAO_ICONS={usos:BIB_ICON_SORT_USOS, recomendados:BIB_ICON_SORT_REC, az:BIB_ICON_SORT_AZ};
  function abrirOrdenarBiblioteca(){
    const opcoes=BIB_ORDENACOES.map(([key,labelKey])=>({value:key,label:t(labelKey),icon:BIB_ORDENACAO_ICONS[key]}));
    bibSheetOpcaoUnica(t('library.sortLabel'), opcoes, bibOrdenacao, function setBibOrdenarPick(v){ bibOrdenacao=v; renderBiblioteca(); closeInfo(); });
  }
  /* Categoria e Segmento viraram um único botão em cascata: Categoria é a
     rede ampla (Design, Audiovisual, Geral…); ao escolher uma categoria que
     tenha segmentos (profissões) associados, o mesmo sheet avança pra um
     segundo passo já filtrado só com esses segmentos (botão Voltar nativo
     do openInfo) — nunca dois botões separados. Categorias sem nenhum
     segmento próprio (ex.: "Geral" — contratos universais, não amarrados a
     uma profissão) aplicam o filtro direto e fecham, sem passo extra vazio. */
  function bibSegmentosDaCategoria(catAmigavel){
    const itens = catAmigavel ? catalogoBiblioteca().filter(i=>i.categoriaAmigavel===catAmigavel) : catalogoBiblioteca();
    return [...new Set(itens.map(i=>i.profissao).filter(Boolean))].sort();
  }
  function abrirCategoriaBiblioteca(){
    const valores=[...new Set(catalogoBiblioteca().map(i=>i.categoriaAmigavel).filter(Boolean))].sort();
    const opcoes=[{value:null,label:t('library.origin.all'),icon:BIB_ICON_ALL}].concat(valores.map(v=>({value:v,label:v,icon:bibIconeCategoriaAmigavel(v)})));
    bibSheetOpcaoUnica(t('library.facet.category'), opcoes, bibCategoriaSel, function setBibCategoriaPick(v){
      bibCategoriaSel=v;
      const segmentos=bibSegmentosDaCategoria(v);
      if(!v || !segmentos.length){ bibSegmentoSel=null; renderBiblioteca(); closeInfo(); return; }
      bibSegmentoSel=null;
      abrirSegmentoBiblioteca(v);
    });
  }
  function abrirSegmentoBiblioteca(cat){
    const valores=bibSegmentosDaCategoria(cat);
    const opcoes=[{value:null,label:t('library.origin.all')}].concat(valores.map(v=>({value:v,label:v})));
    const rows=opcoes.map(o=>
      bibOptRowHtml("bibPickSegmento("+(o.value===null?'null':'\''+String(o.value).replace(/'/g,"\\'")+'\'')+")", o.label, o.value===bibSegmentoSel, BIB_ICON_SEGMENTO)
    ).join('');
    openInfo(cat, '<div class="bib-sort-row">'+rows+'</div>', abrirCategoriaBiblioteca);
  }
  function bibPickSegmento(v){ bibSegmentoSel=v; renderBiblioteca(); closeInfo(); }
  /* Origem: as 4 insígnias (Recomendados/Oficiais/Comunidade/Jurídico) viram
     um único botão multi-seleção — o sheet fica aberto entre toques (não
     fecha ao escolher), pra permitir marcar mais de uma origem de uma vez.
     Ícones reaproveitam OTAG_ICON — o MESMO selo usado no card/detalhe/
     Visualizar pra cada origem, nunca um glifo diferente pro mesmo conceito. */
  function abrirOrigemBiblioteca(){
    const rows=BIB_ORIGENS.map(o=>{
      const on=bibOrigemSel.has(o.key);
      return bibOptRowHtml("toggleBibOrigem('"+o.key+"');abrirOrigemBiblioteca()", t(o.labelKey), on, OTAG_ICON[o.key]);
    }).join('');
    openInfo(t('library.facet.origin'), '<div class="bib-sort-row">'+rows+'</div>');
  }
  /* Menu do botão "Meus Modelos": dá acesso a Favoritos e aos modelos
     próprios do utilizador (substitui os dois botões separados). */
  /* Glifo único de bookmark, reaproveitado no botão quadrado do cabeçalho,
     no favoritar dos cards/detalhe e nas linhas deste menu — mesma marca em
     todo o sistema, nunca um ícone diferente para o mesmo conceito. */
  const BIB_ICON_BOOKMARK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
  const BIB_ICON_LIBRARY='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>';
  const BIB_ICON_NOVO='<span class="nav-ico" style="width:18px;height:18px;display:inline-block;mask-image:url(https://api.iconify.design/material-symbols:drive-file-rename-outline-outline-sharp.svg);-webkit-mask-image:url(https://api.iconify.design/material-symbols:drive-file-rename-outline-outline-sharp.svg)"></span>';
  const BIB_ICON_EXPLORAR='<span class="nav-ico" style="width:18px;height:18px;display:inline-block;mask-image:url(https://api.iconify.design/tabler:world.svg);-webkit-mask-image:url(https://api.iconify.design/tabler:world.svg)"></span>';
  const BIB_ICON_FAVORITOS='<span class="nav-ico" style="width:18px;height:18px;display:inline-block;mask-image:url(https://api.iconify.design/material-symbols:favorite.svg);-webkit-mask-image:url(https://api.iconify.design/material-symbols:favorite.svg)"></span>';
  /* "Meus modelos" — mesmo ícone de Modelos do menu inferior, já que é
     exatamente a mesma coisa vista de dentro. */
  const BIB_ICON_MEUS='<span class="nav-ico" style="width:18px;height:18px;display:inline-block;mask-image:url(https://api.iconify.design/griddy-icons:files-filled.svg);-webkit-mask-image:url(https://api.iconify.design/griddy-icons:files-filled.svg)"></span>';
  const BIB_ICON_ARQUIVO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
  /* Botão "+" da tela de Modelos: 4 caminhos pra criar/reutilizar contrato —
     reaproveita tal e qual os fluxos que existiam no menu Criar (agora
     removido de lá): Novo (builder em branco), Explorar (biblioteca
     comunitária, pushPanel dentro do sheet), Favoritos (bibFavoritos) e
     Salvos (modelosContratoData, com busca). */
  function abrirMenuNovoModelo(){
    const chevr='<svg class="opt-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 18 6-6-6-6"/></svg>';
    const _opt=(onclick,icon,label)=>'<div class="bib-sort-opt" onclick="'+onclick+'"><span class="opt-left"><span class="opt-icon">'+icon+'</span><span>'+label+'</span></span>'+chevr+'</div>';
    const html='<div class="bib-sort-row">'+
      _opt("closeInfo();abrirBuilderParaSelecao(null);showToast(t('toast.blankContract'))",BIB_ICON_NOVO,t('wizard.fromScratch'))+
      _opt("closeInfo();openSheet();pushPanel('comunidade-contratos')",BIB_ICON_EXPLORAR,t('wizard.browseLibrary'))+
      _opt("closeInfo();abrirSalvosBiblioteca()",BIB_ICON_FAVORITOS,t('library.favorites'))+
      _opt("closeInfo();openSheet();pushPanel('contrato-usar')",BIB_ICON_BOOKMARK,t('library.saved'))+
      _opt("closeInfo();abrirImportarArquivo()",BIB_ICON_ARQUIVO,t('import.menuLabel'))+
    '</div>';
    openInfo(t('library.newMenu.title'), html);
  }
  function abrirMenuMeusModelos(){
    const chevr='<svg class="opt-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 18 6-6-6-6"/></svg>';
    const _opt=(onclick,icon,label)=>'<div class="bib-sort-opt" onclick="'+onclick+'"><span class="opt-left"><span class="opt-icon">'+icon+'</span><span>'+label+'</span></span>'+chevr+'</div>';
    const html='<div class="bib-sort-row">'+
      _opt("abrirSalvosBiblioteca()",BIB_ICON_FAVORITOS,t('library.favorites'))+
      _opt("abrirMeusModelosBiblioteca()",BIB_ICON_MEUS,t('library.origin.mine'))+
    '</div>';
    openInfo(t('library.origin.mine'), html);
  }
  /* "Salvos" — modelos pessoais do utilizador: hoje isto é exatamente o
     conjunto de favoritos (bibFavoritos), único mecanismo de "guardar
     modelo" que já existe no catálogo. */
  function abrirSalvosBiblioteca(){
    /* Favoritos são por contrato (baseId); mostra uma linha por contrato,
       preferindo a variação no idioma atual do app. */
    const vistos=new Set();
    const itens=catalogoBiblioteca().filter(i=>{
      if(!bibFavoritos.has(i.baseId)) return false;
      if(i.lang!==LANG && catalogoBiblioteca().some(x=>x.baseId===i.baseId && x.lang===LANG)) return false;
      if(vistos.has(i.baseId)) return false;
      vistos.add(i.baseId); return true;
    });
    const linhas=itens.length ? itens.map(i=>
      '<div class="prow" onclick="closeInfo();abrirDetalheBibliotecaPrincipal(\''+i.id+'\')">'+BIB_ICON_BOOKMARK+
      '<div class="t">'+escapeHtml(i.titulo)+'</div>'+
      '<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 18 6-6-6-6"/></svg></div>'
    ).join('') : '<p class="u-label-soft u-p-4-2">'+t('library.savedEmpty')+'</p>';
    openInfo(t('library.saved'), '<div class="plist">'+linhas+'</div>');
  }
  /* "Meus modelos" — modelos que o próprio utilizador criou/guardou a partir
     de um contrato (modelosContratoData), distinto dos favoritos oficiais. */
  function abrirMeusModelosBiblioteca(){
    const meus=Object.values(modelosContratoData||{});
    const linhas=meus.length ? meus.map(m=>
      '<div class="prow" onclick="closeInfo();usarModeloContrato(\''+m.id+'\')">'+BIB_ICON_LIBRARY+
      '<div class="t">'+escapeHtml(m.nome)+'</div>'+
      '<svg class="chevr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 18 6-6-6-6"/></svg></div>'
    ).join('') : '<p class="u-label-soft u-p-4-2">'+t('library.savedEmpty')+'</p>';
    openInfo(t('library.origin.mine'), '<div class="plist">'+linhas+'</div>');
  }
  function ordenarBibItens(itens){
    const arr=[...itens];
    if(bibOrdenacao==='az') arr.sort((a,b)=>(a.titulo||'').localeCompare(b.titulo||''));
    else if(bibOrdenacao==='recomendados') arr.sort((a,b)=>(b.avaliacao||0)-(a.avaliacao||0));
    else arr.sort((a,b)=>(b.usos||0)-(a.usos||0));
    return arr;
  }
  /* Insígnias de origem coloridas, atreladas ao nome de cada tipo — tanto
     na linha de autor do card quanto no seletor "Origem". Um único
     componente (bibOtag/.bib-seal) em toda a biblioteca — card, sheet de
     detalhe e Visualizar usam exatamente o mesmo selo. */
  function bibAutorLinha(item){
    if(item.origem==='comunidade') return bibOtag('comunidade', item.autor||t('library.origin.community'));
    return bibOtag('oficial', t('library.origin.official'));
  }
  function bibBadgesItem(item){
    const badges=[bibAutorLinha(item)];
    if((item.avaliacao||0)>=4.7) badges.push(bibOtag('recomendados', t('library.origin.recommended')));
    return badges;
  }
  function bibSetDropdownBtn(id, label, ativo, icon){
    const btn=document.getElementById(id);
    if(!btn) return;
    const check='<svg class="dd-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    btn.classList.toggle('on', ativo);
    const icoHtml=icon?'<svg class="bib-filter-ico" viewBox="0 0 24 24">'+icon+'</svg>':'';
    btn.innerHTML=icoHtml+'<span>'+escapeHtml(label)+'</span>'+check;
  }
  function bibAtualizarBotoesFiltro(){
    const catLabel = bibCategoriaSel ? (bibSegmentoSel ? bibCategoriaSel+' · '+bibSegmentoSel : bibCategoriaSel) : t('library.facet.category');
    const ICO_SORT='<path fill="currentColor" d="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z"/>';
    const ICO_LANG='<path fill="currentColor" d="M12.87,15.07L10.33,12.56L10.36,12.53C12.1,10.59 13.34,8.36 14.07,6H17V4H10V2H8V4H1V6H12.17C11.5,7.92 10.44,9.75 9,11.35C8.07,10.32 7.3,9.19 6.69,8H4.69C5.42,9.63 6.42,11.17 7.67,12.56L2.58,17.65L4,19L9,14L12.11,17.11L12.87,15.07M18.5,10H16.5L12,22H14L15.12,19H19.87L21,22H23L18.5,10M15.88,17L17.5,12.67L19.12,17H15.88Z"/>';
    const ICO_CAT='<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 4h6v6h-6zM4 14h6v6H4zm10 3a3 3 0 1 0 6 0a3 3 0 1 0-6 0M4 7a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/>';
    const ICO_ORIG='<path fill="currentColor" d="M10 9h4V6h3l-5-5l-5 5h3zm-1 1H6V7l-5 5l5 5v-3h3zm14 2l-5-5v3h-3v4h3v3zm-9 3h-4v3H7l5 5l5-5h-3z"/>';
    bibSetDropdownBtn('bib-cat-btn', catLabel, !!bibCategoriaSel, ICO_CAT);
    bibSetDropdownBtn('bib-sort-btn', bibOrdenacao!=='usos'?t(BIB_ORDENACOES.find(([k])=>k===bibOrdenacao)[1]):t('library.sortLabelShort'), bibOrdenacao!=='usos', ICO_SORT);
    bibSetDropdownBtn('bib-idioma-btn', bibIdiomaSel?bibNomeIdioma(bibIdiomaSel):t('library.facet.language'), !!bibIdiomaSel, ICO_LANG);
    bibSetDropdownBtn('bib-origem-btn', bibOrigemSel.size ? [...bibOrigemSel].map(k=>t(BIB_ORIGENS.find(o=>o.key===k).labelKeyShort||BIB_ORIGENS.find(o=>o.key===k).labelKey)).join(', ') : t('library.facet.origin'), bibOrigemSel.size>0, ICO_ORIG);
  }
  function renderBiblioteca(){
    const banner=document.getElementById('bib-pick-banner');
    if(banner){
      banner.style.display = bibPickModeCallback ? 'flex' : 'none';
      if(bibPickModeCallback) document.getElementById('bib-pick-banner-txt').textContent =
        t(bibPickModeCallback.modo==='colaboradorMassa' ? 'library.pickForCollabMassa'
          : bibPickModeCallback.modo==='blocos' ? 'library.pickForBlocks'
          : bibPickModeCallback.modo==='clausulas' ? 'library.pickForClauses'
          : 'library.pickForCollab');
    }
    bibAtualizarBotoesFiltro();
    const wrap=document.getElementById('bib-lista');
    if(!wrap) return;
    const q=(document.getElementById('bib-busca').value||'').trim().toLowerCase();
    let itens=bibItensFiltradosPorOrigem();
    if(bibIdiomaSel) itens=itens.filter(i=>i.lang===bibIdiomaSel);
    if(bibCategoriaSel) itens=itens.filter(i=>i.categoriaAmigavel===bibCategoriaSel);
    if(bibSegmentoSel) itens=itens.filter(i=>i.profissao===bibSegmentoSel);
    if(q) itens=itens.filter(i=>((i.titulo||'')+' '+(i.desc||'')+' '+((i.tagsBusca||i.tags||[]).join(' '))+' '+(i.categoria||'')+' '+(i.autor||'')).toLowerCase().includes(q));
    itens=ordenarBibItens(itens);
    document.getElementById('bib-empty').style.display = itens.length? 'none':'block';
    const _bdgIco={
      oficial:'<svg viewBox="0 0 18 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 1L16 4.5V10C16 14.5 12.5 17.5 9 19C5.5 17.5 2 14.5 2 10V4.5L9 1Z"/><path d="M6.5 10.5L8.5 12.5L12.5 8.5"/></svg>',
      juridico:'<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l2.5-6 2.5 6"/><path d="M1 14l2.5-6 2.5 6"/><path d="M5.5 18h7"/><path d="M9 2v16"/><path d="M2 5h2a7 7 0 0 0 5-2 7 7 0 0 0 5 2h2"/></svg>',
      recomendados:'<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15H3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h2"/><path d="M9 5V3a1.5 1.5 0 0 0-1.5-1.5L5 9v6h9.25a1 1 0 0 0 1-.76L16.5 10a1 1 0 0 0-1-.76H11"/></svg>',
      comunidade:'<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="5" r="2.5"/><path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="14" cy="4.5" r="2"/><path d="M13.5 11a4 4 0 0 1 3.5 3.5"/></svg>'
    };
    const _mkCard=i=>{
      const fav=bibFavoritos.has(i.baseId);
      const catLabel=escapeHtml(i.categoriaAmigavel||i.profissao||'');
      const langTag=BIB_LANG_TAG[i.lang]||String(i.lang||'').toUpperCase();
      const origKey=i.origem||'oficial';
      const origBadge='<span class="bc-bdg s-'+origKey+'">'+(_bdgIco[origKey]||_bdgIco.oficial)+'</span>';
      const langBadge='<span class="bc-bdg-lang">'+langTag+'</span>';
      const hexN=i.numBlocos?String(i.numBlocos):'';
      const hexFs=hexN.length<=1?8:hexN.length<=2?7:6;
      const blocksBadge=hexN?'<span class="bc-bdg"><svg viewBox="0 0 22 22"><rect x="1" y="6" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="8" y="1" width="13" height="13" rx="2" fill="#111111"/><rect x="8" y="1" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="14.5" y="7.5" text-anchor="middle" dominant-baseline="central" font-size="'+hexFs+'" font-weight="800" fill="currentColor">'+hexN+'</text></svg></span>':'';
      const favBtn='<div class="bib-fav'+(fav?' on':'')+'" onclick="event.stopPropagation();toggleFavBiblioteca(\''+i.baseId+'\')"><svg viewBox="0 0 24 24" fill="'+(fav?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg></div>';
      return '<div class="bib-card" onclick="abrirItemBiblioteca(\''+i.id+'\')">'+
        '<div class="bc-body">'+
          '<div class="bc-title">'+escapeHtml(i.titulo)+'</div>'+
          (catLabel?'<div class="bc-cat">'+catLabel+'</div>':'')+
          '<div class="bc-desc">'+escapeHtml(i.desc||'')+'</div>'+
        '</div>'+
        '<div class="bc-foot"><div class="bc-meta"><div class="bc-meta-l">'+origBadge+langBadge+blocksBadge+'</div>'+favBtn+'</div></div>'+
      '</div>';
    };
    wrap.innerHTML=itens.map(_mkCard).join('');
  }
  function toggleFavBiblioteca(id){
    if(bibFavoritos.has(id)){ bibFavoritos.delete(id); showToast(t('library.unfavorited')); }
    else { bibFavoritos.add(id); showToast(t('library.favorited')); if(navigator.vibrate)navigator.vibrate(6); }
    saveBibFavoritos();
    renderBiblioteca();
  }
  function bibEstruturaProtegidaHtml(item){
    /* Estrutura real de blocos do contrato oficial (nome + obrigatório/
       opcional/condicional), vinda do Blueprint — a composição detalhada
       de cláusulas por bloco (para import seletivo) ainda não existe, ver
       nota em blocosParaModeloBiblioteca. Cada bloco vira uma tira de 20
       mini-blocos preenchendo a linha toda — mesmo padrão visual (grid de
       segmentos + gradiente --fill) do card "Estatísticas Operacionais" da
       Dashboard, só que numa versão pequena — o "score" de cobertura
       jurídica do bloco (obrigatório cobre mais que opcional) fica visível
       de forma imediata em vez de uma barra de progresso genérica. */
    if(!item.blocks || !item.blocks.length) return '<p class="u-sm-nd u-mb-12">'+t('library.structureUnavailable')+'</p>';
    return '<div class="bib-struct-list">'+item.blocks.map(b=>{
      const tagKey = b.status==='REQUIRED' ? 'library.blockRequired' : b.status==='CONDITIONAL' ? 'library.blockConditional' : 'library.blockOptional';
      const icone = b.status==='REQUIRED' ? BIB_ICON_REQUIRED : b.status==='CONDITIONAL' ? BIB_ICON_CONDITIONAL : BIB_ICON_OPTIONAL;
      return '<div class="bib-struct-row"><div class="lbl">'+escapeHtml(blockName({key:null,name:b.name}))+' <span class="bib-struct-tag">'+icone+t(tagKey)+'</span></div></div>';
    }).join('')+'</div>';
  }
  /* "Visualizar" — mostra TODOS os blocos do contrato (nome + cláusulas) no
     idioma do card, com os [PLACEHOLDERS] visíveis. Só leitura; o botão
     Importar leva ao editor com o painel de campos dinâmicos. */
  async function abrirVisualizarContratoCompleto(rawId, lang, titulo){
    openInfo('', '<p class="u-label-nd">…</p>');
    const detail = await LegalLibrary.getDetail(rawId, lang||LANG);
    if(!detail || !detail.blocks || !detail.blocks.length){
      document.getElementById('infoBody').innerHTML='<p class="u-label-nd">'+t('library.structureUnavailable')+'</p>';
      return;
    }
    const it=LegalLibrary.get(rawId);
    /* Cabeçalho numa linha: Pivots · Idioma · nº de blocos. Nenhum modelo
       ainda passou por revisão jurídica real (são todos gerados por IA),
       então a tag Jurídico não é usada aqui — só Pivots. */
    const head=[];
    head.push(bibOtag('oficial', t('library.origin.official')));
    head.push('<span class="vis-meta">'+(BIB_LANG_TAG[lang||LANG]||String(lang||LANG).toUpperCase())+'</span>');
    head.push('<span class="vis-meta">'+BIB_ICON_BLOCKS+detail.blocks.length+' '+t('library.blocksCount')+'</span>');
    const blocosHtml=detail.blocks.map(b=>{
      const tagKey = b.status==='REQUIRED' ? 'library.blockRequired' : b.status==='CONDITIONAL' ? 'library.blockConditional' : 'library.blockOptional';
      const icone = b.status==='REQUIRED' ? BIB_ICON_REQUIRED : b.status==='CONDITIONAL' ? BIB_ICON_CONDITIONAL : BIB_ICON_OPTIONAL;
      const texto=(b.clauses||[]).map(c=>c.text).join('\n\n');
      return '<div class="vis-bloco"><div class="vis-bloco-h">'+escapeHtml(blockName({key:null,name:b.name}))+'<span class="vis-bloco-tag">'+icone+t(tagKey)+'</span></div>'+
        '<div class="vis-bloco-txt">'+escapeHtml(texto)+'</div></div>';
    }).join('');
    document.getElementById('infoBody').innerHTML=
      '<div class="vis-screen">'+
        '<h2 class="vis-title">'+escapeHtml(titulo||(it&&it.titulo)||'')+'</h2>'+
        '<div class="vis-head">'+head.join('')+'</div>'+
        '<div class="vis-card">'+blocosHtml+'</div>'+
        '<button class="btn soft u-w-full" onclick="closeInfo();importarModeloBiblioteca(\''+rawId+'\',\''+(lang||LANG)+'\')">'+BIB_ICON_ARROW+t('library.import')+'</button>'+
      '</div>';
    document.getElementById('infoOverlay').classList.add('vis-glass-mode');
    document.getElementById('infoSheet').classList.add('vis-glass-mode');
  }
  /* Em modo de seleção de blocos/cláusulas (Builder → Adicionar Bloco/
     Cláusulas), a tela de detalhe do contrato (descrição, estrutura, tags,
     favoritar) não serve pra nada — o utilizador só quer entrar direto nos
     blocos pra escolher o que importar. Pular direto evita um passo morto
     e a falsa impressão de que "abre a visualização" em vez dos blocos. */
  function abrirItemBiblioteca(id){
    if(bibPickModeCallback && (bibPickModeCallback.modo==='blocos'||bibPickModeCallback.modo==='clausulas')){
      const it=catalogoBiblioteca().find(i=>i.id===id);
      if(!it) return;
      if(bibPickModeCallback.modo==='blocos') abrirSelecaoBlocosContrato(it.rawId, it.lang, it.titulo);
      else abrirSelecaoBlocoParaClausulas(it.rawId, it.lang, it.titulo);
      return;
    }
    abrirDetalheBibliotecaPrincipal(id);
  }
  function abrirDetalheBibliotecaPrincipal(id){
    const it=catalogoBiblioteca().find(i=>i.id===id);
    if(!it) return;
    const fav=bibFavoritos.has(it.baseId);
    let html='';
    if(it.desc) html+='<p style="font-size:13.5px;color:var(--ink-soft);line-height:1.5;margin-bottom:10px">'+escapeHtml(it.desc)+'</p>';
    const favIconOnly='<button class="bib-fav-inline'+(fav?' on':'')+'" onclick="toggleFavEReabrirDetalhe(\''+it.baseId+'\',\''+it.id+'\')"><svg viewBox="0 0 24 24" fill="'+(fav?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg></button>';
    const chips=[bibBadgesItem(it).join('')+'<span class="vis-meta">'+(BIB_LANG_TAG[it.lang]||'')+'</span>'];
    if(it.usos) chips.push('<span class="vis-meta">'+it.usos+' '+t('library.recommendCount')+'</span>');
    if(it.numBlocos) chips.push('<span class="vis-meta">'+it.numBlocos+' '+t('library.blocksCount')+'</span>');
    html+='<div class="vis-head u-mb-14"><div style="flex:1;display:flex;flex-wrap:wrap;gap:6px;align-items:center">'+chips.join('')+'</div>'+favIconOnly+'</div>';
    html+='<div class="plabel">'+t('library.protectedStructure')+'</div>';
    html+=bibEstruturaProtegidaHtml(it);
    /* tagsBusca mistura as tags reais com facetas internas de busca
       (categoria amigável, subcategoria crua do catálogo, profissão e
       contexto — estes dois últimos strings fixas em português) — exibir
       isso mostrava tags em inglês misturadas com palavras em português
       independente do idioma da app. it.tags já vem traduzido como um bloco
       único para o idioma de "it.lang" por catalogoBiblioteca
       (LegalLibrary.tagsEm, lida de legal-library/i18n/meta.json — nunca
       palavra a palavra), então é a única fonte usada aqui; tagsBusca
       continua reservada para o filtro de busca. */
    const tagsExibidas=it.tags||[];
    if(tagsExibidas.length) html+='<div class="bc-tags u-mb-14">'+tagsExibidas.map(tg=>'<span class="bib-minitag">'+escapeHtml(tg)+'</span>').join('')+'</div>';
    /* Chega aqui só fora do modo de seleção de blocos/cláusulas — botões vão pro dock fixo */
    const usarOnclick = bibPickModeCallback
      ? "closeInfo();bibSelecionarParaDestino('"+it.rawId+"','"+it.lang+"')"
      : (it.onclick ? "closeInfo();"+it.onclick : "closeInfo();importarModeloBiblioteca('"+it.rawId+"','"+it.lang+"')");
    let dockHtml='';
    if(!it.onclick) dockHtml+='<button class="idb" onclick="abrirVisualizarContratoCompleto(\''+it.rawId+'\',\''+it.lang+'\',\''+escapeHtml(it.titulo).replace(/'/g,"\\'")+'\')"><div class="idb-ico">'+BIB_ICON_EYE+'</div><span class="idb-label">'+t('library.viewBlock')+'</span></button>';
    dockHtml+='<button class="idb" onclick="'+usarOnclick.replace(/"/g,'&quot;')+'"><div class="idb-ico">'+BIB_ICON_ARROW+'</div><span class="idb-label">'+t('library.import')+'</span></button>';
    openInfo(it.titulo, html, undefined, 'bib-title-font', dockHtml);
  }
  /* Favoritar dentro do detalhe não pode fechar o sheet (era o mesmo bug de
     fechamento abrupto reportado noutras telas) — reabre o mesmo detalhe no
     lugar, só que com o ícone/rótulo do botão já refletindo o novo estado. */
  function toggleFavEReabrirDetalhe(baseId, itemId){
    toggleFavBiblioteca(baseId);
    abrirDetalheBibliotecaPrincipal(itemId);
  }
  function cancelarSelecaoBiblioteca(){
    const ctx=bibPickModeCallback;
    bibPickModeCallback=null;
    if(ctx && (ctx.modo==='blocos'||ctx.modo==='clausulas')){ go('builder'); return; }
    if(ctx && (ctx.modo==='colaborador'||ctx.modo==='colaboradorMassa')){ go('detalhe'); return; }
    renderBiblioteca();
  }
  /* Aplica o contrato escolhido na Biblioteca completa ao destino que pediu
     a seleção (colaborador único ou aplicação em massa) — mesmo motor de
     blocos/campos dinâmicos do import normal (importarModeloBiblioteca),
     só que devolve o resultado pro fluxo de colaboradores em vez de ir pro
     builder de contrato do trabalho. */
  async function bibSelecionarParaDestino(rawId, lang){
    const ctx=bibPickModeCallback;
    if(!ctx) return;
    bibPickModeCallback=null;
    const m=LegalLibrary.get(rawId);
    if(!m) return;
    marcarModeloComoUsado(rawId);
    const nome = lang ? LegalLibrary.tituloEm(m, lang) : m.titulo;
    /* Contrato de colaborador é um acordo à parte do contrato do cliente do
       trabalho — não deve herdar CLIENT_NAME/valor/data/local do projeto
       (senão o modelo já vem preenchido com o nome do cliente do job, o que
       não faz sentido para um acordo com o colaborador). Só o nome da
       própria empresa/prestador é reaproveitado; o resto fica em branco
       para o utilizador preencher pelos campos dinâmicos do Builder. */
    const empresa=perfilData && perfilData.empresa;
    const valores=empresa ? {PROVIDER_NAME:empresa} : {};
    const blocks=await blocosParaModeloBiblioteca(m, lang, valores);
    const modeloOrigem={ client:'', nome, blocks, fieldValues:valores };
    builderColabCtx=ctx;
    abrirBuilder(null, modeloOrigem);
  }
  function addModeloItem(){
    const inp=document.getElementById('ml-newitem'); const v=inp.value.trim(); if(!v) return;
    const row=document.createElement('div'); row.className='addlist-row';
    row.innerHTML='<span class="dots">⠿</span><span class="tx">'+escapeHtml(v)+'</span><span class="rm" onclick="this.parentElement.remove()">✕</span>';
    document.getElementById('ml-items').appendChild(row);
    inp.value='';
  }
  function guardarModeloLista(){
    const nome=document.getElementById('ml-nome').value.trim() || modeloListCopy[modeloListType].placeholder;
    closeSheet(); showToast('"'+nome+t('toast.savedMascSuffix'));
  }
