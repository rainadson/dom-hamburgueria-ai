# TASK-0129 — HTTPS e cabeçalhos de segurança

## Verificação em produção

| Serviço | HTTPS | HSTS | Proteções adicionais |
| --- | --- | --- | --- |
| Render/backend | HTTP 200 | 1 ano, inclui subdomínios | CSP, `SAMEORIGIN`, `nosniff` e demais cabeçalhos do Helmet |
| Vercel/frontend | HTTP 200 | 2 anos, inclui subdomínios e preload | configurados no projeto nesta tarefa |

O `frontend/vercel.json` passa a enviar:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy` bloqueando câmera, microfone e geolocalização, que a aplicação não utiliza.

Não foi adicionada CSP ao frontend nesta etapa porque a política precisa contemplar Supabase e a API pública e deve ser validada no navegador antes de ser imposta. O backend já possui CSP pelo Helmet.

A TASK-0129 fica concluída no código. Os novos cabeçalhos da Vercel devem ser confirmados após publicação.
