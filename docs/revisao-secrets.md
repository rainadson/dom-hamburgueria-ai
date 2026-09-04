# Variáveis e arquivos versionados — 03/09/2026

Auditoria limitada aos nomes de arquivos rastreados e referências a variáveis no código. Nenhum valor de `.env` foi impresso ou copiado.

- `git ls-files` não encontrou `.env`, `.pem`, `.key`, arquivo com nome `secret` ou `credential` rastreado.
- `.gitignore` raiz ignora `.env` em subdiretórios; frontend também ignora `*.local`.
- Adicionados exemplos somente com marcadores: backend requer SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e GROQ_API_KEY; frontend recebe apenas URL e chave publicável. A service role não aparece no exemplo do frontend.
- MANUAL_ORDER_SUBMIT_ENABLED permanece false no exemplo. PORT é opcional.
- `backend/src/config/supabase.ts` referencia SUPABASE_KEY, mas não possui importador localizado; não removido nesta auditoria.

## Fechamento da TASK-0124

Arquivos atuais e todo o histórico Git foram verificados por nomes sensíveis e padrões de alto risco sem imprimir valores. Não há `.env`, certificado, chave privada ou arquivo de credenciais versionado. Os únicos arquivos de ambiente rastreados são `backend/.env.example` e `frontend/.env.example`, ambos com placeholders. As ocorrências nos testes são URLs e tokens fictícios; o cliente Supabase privilegiado lê `SUPABASE_SERVICE_ROLE_KEY` exclusivamente do ambiente do backend.

O `.gitignore` passou a cobrir variantes `.env.*`, preservando apenas `.env.example`, além de certificados, chaves e arquivos comuns de credenciais. A TASK-0124 fica concluída para o repositório Git.

Limites: esta verificação não comprova a ausência de segredos nos painéis, logs remotos ou computadores de operadores, nem a validade ou rotação das credenciais atuais. Rotação é uma operação externa e só deve ocorrer diante de exposição confirmada ou política definida.
