# TASK-0127 — contrato de variáveis de ambiente

## Backend (Render)

| Variável | Finalidade | Exposição |
| --- | --- | --- |
| `SUPABASE_URL` | endereço do projeto Supabase | servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | acesso privilegiado usado pelo backend | somente servidor |
| `GROQ_API_KEY` | processamento da conversa com IA | somente servidor |
| `MANUAL_ORDER_SUBMIT_ENABLED` | ativa explicitamente a gravação de pedido manual | servidor; padrão documentado `false` |
| `PORT` | porta fornecida pela plataforma | servidor; opcional localmente |

## Frontend (Vercel)

| Variável | Finalidade | Exposição |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | autenticação Supabase no navegador | pública por definição do Vite |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | chave publicável do Supabase | pública; protegida por autenticação/RLS |

O frontend não contém nem referencia a chave `service_role`. O backend não utiliza variáveis com prefixo `VITE_`.

## Auditoria

- Os nomes utilizados no código coincidem com os dois arquivos `.env.example`.
- Removido `backend/src/config/supabase.ts`, arquivo órfão que referenciava a variável antiga `SUPABASE_KEY` e não era importado.
- Nenhum valor foi lido, impresso ou alterado.
- A aplicação autenticada carrega dados em produção, comprovando a configuração funcional de Supabase no frontend e backend. A presença da chave de IA não foi testada com uma conversa real para evitar consumo e criação de dados.

A TASK-0127 fica concluída quanto ao contrato versionado. Alterações futuras de valores devem ser feitas nos painéis das plataformas, nunca no Git.
