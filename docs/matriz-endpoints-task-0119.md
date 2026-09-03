# TASK-0119 — Matriz de proteção dos endpoints

Revisão concluída em 3 de setembro de 2026.

| Área | Endpoints | Acesso |
| --- | --- | --- |
| Saúde da API | `GET /` | Público |
| WhatsApp | `/api/whatsapp/*` | ADMIN e LOJA autenticados |
| Conversas | `/api/conversations/*` | ADMIN e LOJA autenticados |
| Pedidos | `/api/orders/*` | ADMIN e LOJA autenticados |
| Chat operacional | `POST /api/chat` | ADMIN e LOJA autenticados |
| Produtos, leitura | `GET /api/products/*` | ADMIN e LOJA autenticados |
| Produtos, alterações | `POST`, `PUT` e `DELETE /api/products/*` | Somente ADMIN |
| Dashboard | `/api/dashboard/*` | ADMIN e LOJA autenticados |

Rotas antigas (`/api/test-db` e `/api/webhook`) e qualquer endpoint de API inexistente retornam `404` em JSON, sem detalhes internos. Identificadores de conversa precisam ser inteiros positivos seguros antes de qualquer consulta ao banco.
