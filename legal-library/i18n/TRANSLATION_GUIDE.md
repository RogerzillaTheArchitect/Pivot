# Guia de tradução manual (Perplexity) — Legal Library

## Como funciona (modo lote — até 20 arquivos por vez)

1. Vá na pasta `Pivot Legal Library/Legal Library/Contracts/` e selecione os arquivos
   do lote (veja os 3 lotes prontos mais abaixo: 20 + 20 + 21 arquivos).
2. Envie esses arquivos (upload direto, os `.md` inteiros — não precisa recortar nada)
   pro Perplexity junto com o prompt abaixo, trocando `{IDIOMA}` por `pt-BR` ou `es`.
3. Quando a resposta vier, copie a resposta INTEIRA e me manda de volta aqui no chat
   (cola o texto todo, mesmo que seja longo). Eu separo automaticamente em um arquivo
   por contrato, valido o JSON e os placeholders, e salvo em
   `legal-library/i18n/pt/<slug>.json` ou `legal-library/i18n/es/<slug>.json`.
4. Repita para os outros lotes e depois para o outro idioma.

Total: 3 lotes × 2 idiomas = 6 envios pro Perplexity, 6 respostas coladas de volta aqui.

## Prompt para colar no Perplexity (junto com o upload dos arquivos)

```
Você é um tradutor jurídico especializado em contratos comerciais. Recebi vários
arquivos, cada um é um contrato-modelo completo em inglês (formato Markdown).
Para CADA arquivo, faça o seguinte:

1. Localize dentro do arquivo a seção que começa em
   "## STEP 4 — CLAUSES (MASTER ENGLISH, PER PLDS-001)" e vai até (sem incluir)
   "## STEP 5 — SELF-REVIEW". IGNORE completamente todo o resto do arquivo
   (STEP 1, 2, 3, 5, 6, FINAL STATUS etc. — isso é anotação interna, não faz
   parte do contrato e não deve aparecer na sua resposta de forma alguma).
2. Dentro dessa seção, cada bloco começa com "### BLOCK: <nome> [STATUS]" e cada
   cláusula tem um id em negrito (ex: **services.scope**) seguido do texto.
3. Traduza o texto de cada cláusula do inglês para {IDIOMA}.

REGRAS OBRIGATÓRIAS DE TRADUÇÃO:
- Traduza APENAS o texto da cláusula. NÃO traduza nomes de bloco (mantenha em
  inglês, ex: "Identification", "Services"), NÃO traduza o id da cláusula
  (ex: "services.scope"), NÃO traduza o status do bloco (REQUIRED/OPTIONAL/CONDITIONAL).
- Os placeholders entre colchetes, tipo [CLIENT_NAME], [PROJECT_NAME], [DELIVERY_DATE],
  DEVEM permanecer EXATAMENTE como estão, no mesmo lugar da frase (não traduza o nome
  do placeholder, não mova de posição, não remova os colchetes).
- A tradução deve soar como um contrato redigido originalmente em {IDIOMA} por um
  advogado nativo — tom jurídico natural e fluente. PROIBIDO tradução literal/palavra
  por palavra estilo Google Tradutor. Adapte a estrutura da frase quando necessário
  para soar natural, mantendo o mesmo significado e efeito jurídico.
- Mantenha o mesmo número de cláusulas e blocos de cada contrato original, na mesma ordem.

FORMATO DE SAÍDA (muito importante — vou processar sua resposta com um script):
Devolva um único JSON array, um objeto por arquivo recebido, nesta estrutura exata,
sem nenhum texto fora do array, sem comentários, sem markdown fence, só o JSON puro:

[
  {
    "sourceFile": "<nome exato do arquivo original, ex: 01_GENERAL_SERVICES_AGREEMENT_CLAUSES.md>",
    "language": "{IDIOMA}",
    "status": "Pending Legal Review",
    "blocks": [
      {
        "name": "<nome do bloco em inglês>",
        "clauses": [
          { "id": "<id da cláusula>", "text": "<texto traduzido>" }
        ]
      }
    ]
  }
]

Se a resposta ficar muito longa e for cortada, me avise no final que ficou incompleto
em vez de inventar ou resumir cláusulas.
```

## Os 3 lotes (61 arquivos = 20 + 20 + 21)

**Lote 1 (20 arquivos):**
01_GENERAL_SERVICES_AGREEMENT_CLAUSES.md, 02_FREELANCE_SERVICES_AGREEMENT_CLAUSES.md, 03_NON_DISCLOSURE_AGREEMENT_CLAUSES.md, 04_NON_COMPETE_AGREEMENT_CLAUSES.md, 05_COPYRIGHT_ASSIGNMENT_AGREEMENT_CLAUSES.md, 06_SOFTWARE_LICENSE_AGREEMENT_CLAUSES.md, 07_SERVICE_LEVEL_AGREEMENT_CLAUSES.md, 08_COMMISSION_AGREEMENT_CLAUSES.md, 09_RESELLER_AGREEMENT_CLAUSES.md, 10_PARTNERSHIP_AGREEMENT_CLAUSES.md, 11_WEDDING_PHOTOGRAPHY_AGREEMENT_CLAUSES.md, 12_CORPORATE_PHOTOGRAPHY_AGREEMENT_CLAUSES.md, 13_PORTRAIT_PHOTOGRAPHY_AGREEMENT_CLAUSES.md, 14_REAL_ESTATE_PHOTOGRAPHY_AGREEMENT_CLAUSES.md, 15_FASHION_PHOTOGRAPHY_AGREEMENT_CLAUSES.md, 16_PRODUCT_PHOTOGRAPHY_AGREEMENT_CLAUSES.md, 17_EVENT_PHOTOGRAPHY_AGREEMENT_CLAUSES.md, 18_WEDDING_VIDEOGRAPHY_AGREEMENT_CLAUSES.md, 19_CORPORATE_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md, 20_COMMERCIAL_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md

**Lote 2 (20 arquivos):**
21_SOCIAL_MEDIA_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md, 22_REAL_ESTATE_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md, 23_EVENT_VIDEOGRAPHY_AGREEMENT_CLAUSES.md, 24_MUSIC_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md, 25_DOCUMENTARY_PRODUCTION_AGREEMENT_CLAUSES.md, 26_DRONE_SERVICES_AGREEMENT_CLAUSES.md, 27_BRAND_IDENTITY_DESIGN_AGREEMENT_CLAUSES.md, 28_GRAPHIC_DESIGN_SERVICES_AGREEMENT_CLAUSES.md, 29_UI_DESIGN_SERVICES_AGREEMENT_CLAUSES.md, 30_UX_DESIGN_SERVICES_AGREEMENT_CLAUSES.md, 31_WEB_DESIGN_SERVICES_AGREEMENT_CLAUSES.md, 32_WEBSITE_DEVELOPMENT_AGREEMENT_CLAUSES.md, 33_MOBILE_APPLICATION_DEVELOPMENT_AGREEMENT_CLAUSES.md, 34_CUSTOM_SOFTWARE_DEVELOPMENT_AGREEMENT_CLAUSES.md, 35_SAAS_DEVELOPMENT_AGREEMENT_CLAUSES.md, 36_API_DEVELOPMENT_AGREEMENT_CLAUSES.md, 37_SOFTWARE_MAINTENANCE_AGREEMENT_CLAUSES.md, 38_TECHNICAL_CONSULTING_AGREEMENT_CLAUSES.md, 39_DIGITAL_MARKETING_SERVICES_AGREEMENT_CLAUSES.md, 40_SOCIAL_MEDIA_MANAGEMENT_AGREEMENT_CLAUSES.md

**Lote 3 (21 arquivos):**
41_PAID_ADVERTISING_MANAGEMENT_AGREEMENT_CLAUSES.md, 42_SEO_SERVICES_AGREEMENT_CLAUSES.md, 43_CONTENT_MARKETING_SERVICES_AGREEMENT_CLAUSES.md, 44_BUSINESS_CONSULTING_AGREEMENT_CLAUSES.md, 45_COACHING_SERVICES_AGREEMENT_CLAUSES.md, 46_MENTORSHIP_AGREEMENT_CLAUSES.md, 47_ACCOUNTING_SERVICES_AGREEMENT_CLAUSES.md, 48_HUMAN_RESOURCES_CONSULTING_AGREEMENT_CLAUSES.md, 49_AUDITING_SERVICES_AGREEMENT_CLAUSES.md, 50_ARCHITECTURAL_DESIGN_AGREEMENT_CLAUSES.md, 51_INTERIOR_DESIGN_AGREEMENT_CLAUSES.md, 52_ENGINEERING_SERVICES_AGREEMENT_CLAUSES.md, 53_CONSTRUCTION_MANAGEMENT_AGREEMENT_CLAUSES.md, 54_PROPERTY_INSPECTION_AGREEMENT_CLAUSES.md, 55_REAL_ESTATE_CONSULTING_AGREEMENT_CLAUSES.md, 56_EDUCATIONAL_SERVICES_AGREEMENT_CLAUSES.md, 57_EVENT_PRODUCTION_AGREEMENT_CLAUSES.md, 58_AUDIO_PRODUCTION_AGREEMENT_CLAUSES.md, 59_TRANSLATION_SERVICES_AGREEMENT_CLAUSES.md, 60_CONTENT_WRITING_AGREEMENT_CLAUSES.md, 61_PODCAST_PRODUCTION_AGREEMENT_CLAUSES.md

## Tabela: arquivo original → slug (nome do arquivo de saída)

| Arquivo | slug |
|---|---|
| 01_GENERAL_SERVICES_AGREEMENT_CLAUSES.md | general_services_agreement |
| 02_FREELANCE_SERVICES_AGREEMENT_CLAUSES.md | freelance_services_agreement |
| 03_NON_DISCLOSURE_AGREEMENT_CLAUSES.md | non_disclosure_agreement_nda |
| 04_NON_COMPETE_AGREEMENT_CLAUSES.md | non_compete_agreement |
| 05_COPYRIGHT_ASSIGNMENT_AGREEMENT_CLAUSES.md | copyright_assignment_agreement |
| 06_SOFTWARE_LICENSE_AGREEMENT_CLAUSES.md | software_license_agreement |
| 07_SERVICE_LEVEL_AGREEMENT_CLAUSES.md | service_level_agreement_sla |
| 08_COMMISSION_AGREEMENT_CLAUSES.md | commission_agreement |
| 09_RESELLER_AGREEMENT_CLAUSES.md | reseller_agreement |
| 10_PARTNERSHIP_AGREEMENT_CLAUSES.md | partnership_agreement |
| 11_WEDDING_PHOTOGRAPHY_AGREEMENT_CLAUSES.md | wedding_photography_agreement |
| 12_CORPORATE_PHOTOGRAPHY_AGREEMENT_CLAUSES.md | corporate_photography_agreement |
| 13_PORTRAIT_PHOTOGRAPHY_AGREEMENT_CLAUSES.md | portrait_photography_agreement |
| 14_REAL_ESTATE_PHOTOGRAPHY_AGREEMENT_CLAUSES.md | real_estate_photography_agreement |
| 15_FASHION_PHOTOGRAPHY_AGREEMENT_CLAUSES.md | fashion_photography_agreement |
| 16_PRODUCT_PHOTOGRAPHY_AGREEMENT_CLAUSES.md | product_photography_agreement |
| 17_EVENT_PHOTOGRAPHY_AGREEMENT_CLAUSES.md | event_photography_agreement |
| 18_WEDDING_VIDEOGRAPHY_AGREEMENT_CLAUSES.md | wedding_videography_agreement |
| 19_CORPORATE_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md | corporate_video_production_agreement |
| 20_COMMERCIAL_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md | commercial_video_production_agreement |
| 21_SOCIAL_MEDIA_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md | social_media_video_production_agreement |
| 22_REAL_ESTATE_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md | real_estate_video_production_agreement |
| 23_EVENT_VIDEOGRAPHY_AGREEMENT_CLAUSES.md | event_videography_agreement |
| 24_MUSIC_VIDEO_PRODUCTION_AGREEMENT_CLAUSES.md | music_video_production_agreement |
| 25_DOCUMENTARY_PRODUCTION_AGREEMENT_CLAUSES.md | documentary_production_agreement |
| 26_DRONE_SERVICES_AGREEMENT_CLAUSES.md | drone_services_agreement |
| 27_BRAND_IDENTITY_DESIGN_AGREEMENT_CLAUSES.md | brand_identity_design_agreement |
| 28_GRAPHIC_DESIGN_SERVICES_AGREEMENT_CLAUSES.md | graphic_design_services_agreement |
| 29_UI_DESIGN_SERVICES_AGREEMENT_CLAUSES.md | ui_design_services_agreement |
| 30_UX_DESIGN_SERVICES_AGREEMENT_CLAUSES.md | ux_design_services_agreement |
| 31_WEB_DESIGN_SERVICES_AGREEMENT_CLAUSES.md | web_design_services_agreement |
| 32_WEBSITE_DEVELOPMENT_AGREEMENT_CLAUSES.md | website_development_agreement |
| 33_MOBILE_APPLICATION_DEVELOPMENT_AGREEMENT_CLAUSES.md | mobile_application_development_agreement |
| 34_CUSTOM_SOFTWARE_DEVELOPMENT_AGREEMENT_CLAUSES.md | custom_software_development_agreement |
| 35_SAAS_DEVELOPMENT_AGREEMENT_CLAUSES.md | saas_development_agreement |
| 36_API_DEVELOPMENT_AGREEMENT_CLAUSES.md | api_development_agreement |
| 37_SOFTWARE_MAINTENANCE_AGREEMENT_CLAUSES.md | software_maintenance_agreement |
| 38_TECHNICAL_CONSULTING_AGREEMENT_CLAUSES.md | technical_consulting_agreement |
| 39_DIGITAL_MARKETING_SERVICES_AGREEMENT_CLAUSES.md | digital_marketing_services_agreement |
| 40_SOCIAL_MEDIA_MANAGEMENT_AGREEMENT_CLAUSES.md | social_media_management_agreement |
| 41_PAID_ADVERTISING_MANAGEMENT_AGREEMENT_CLAUSES.md | paid_advertising_management_agreement |
| 42_SEO_SERVICES_AGREEMENT_CLAUSES.md | seo_services_agreement |
| 43_CONTENT_MARKETING_SERVICES_AGREEMENT_CLAUSES.md | content_marketing_services_agreement |
| 44_BUSINESS_CONSULTING_AGREEMENT_CLAUSES.md | business_consulting_agreement |
| 45_COACHING_SERVICES_AGREEMENT_CLAUSES.md | coaching_services_agreement |
| 46_MENTORSHIP_AGREEMENT_CLAUSES.md | mentorship_agreement |
| 47_ACCOUNTING_SERVICES_AGREEMENT_CLAUSES.md | accounting_services_agreement |
| 48_HUMAN_RESOURCES_CONSULTING_AGREEMENT_CLAUSES.md | human_resources_consulting_agreement |
| 49_AUDITING_SERVICES_AGREEMENT_CLAUSES.md | auditing_services_agreement |
| 50_ARCHITECTURAL_DESIGN_AGREEMENT_CLAUSES.md | architectural_design_agreement |
| 51_INTERIOR_DESIGN_AGREEMENT_CLAUSES.md | interior_design_agreement |
| 52_ENGINEERING_SERVICES_AGREEMENT_CLAUSES.md | engineering_services_agreement |
| 53_CONSTRUCTION_MANAGEMENT_AGREEMENT_CLAUSES.md | construction_management_agreement |
| 54_PROPERTY_INSPECTION_AGREEMENT_CLAUSES.md | property_inspection_agreement |
| 55_REAL_ESTATE_CONSULTING_AGREEMENT_CLAUSES.md | real_estate_consulting_agreement |
| 56_EDUCATIONAL_SERVICES_AGREEMENT_CLAUSES.md | educational_services_agreement |
| 57_EVENT_PRODUCTION_AGREEMENT_CLAUSES.md | event_production_agreement |
| 58_AUDIO_PRODUCTION_AGREEMENT_CLAUSES.md | audio_production_agreement |
| 59_TRANSLATION_SERVICES_AGREEMENT_CLAUSES.md | translation_services_agreement |
| 60_CONTENT_WRITING_AGREEMENT_CLAUSES.md | content_writing_agreement |
| 61_PODCAST_PRODUCTION_AGREEMENT_CLAUSES.md | podcast_production_agreement |

## Quando terminar cada lote

Cola a resposta inteira do Perplexity aqui no chat (pode ser um lote de cada vez,
não precisa esperar os 6). Eu separo por contrato usando a tabela acima, valido o
JSON e os placeholders `[DYNAMIC_FIELD]`, e salvo cada um em
`legal-library/i18n/pt/<slug>.json` ou `legal-library/i18n/es/<slug>.json`.
