# Variáveis e arquivos versionados — 03/09/2026

Auditoria limitada aos nomes de arquivos rastreados e referências a variáveis no código. Nenhum valor de `.env` foi impresso ou copiado.

- `git ls-files` não encontrou `.env`, `.pem`, `.key`, arquivo com nome `secret` ou `credential` rastreado.
- `.gitignore` raiz ignora `.env` em subdiretórios; frontend também ignora `*.local`.
- Adicionados exemplos somente com marcadores: backend requer SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e GROQ_API_KEY; frontend recebe apenas URL e chave publicável. A service role não aparece no exemplo do frontend.
- MANUAL_ORDER_SUBMIT_ENABLED permanece false no exemplo. PORT é opcional.
- `backend/src/config/supabase.ts` referencia SUPABASE_KEY, mas não possui importador localizado; não removido nesta auditoria.

Limitações: não foi analisado histórico Git, plataforma de deploy, logs remotos, validade/rotação de credenciais ou arquivos ignorados. Assim, TASK-0124 continua parcial. Rotação exige ação no fornecedor e aprovação; exemplos não substituem gestão de secrets.
