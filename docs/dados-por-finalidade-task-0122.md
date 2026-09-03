# TASK-0122 — Dados por perfil e finalidade

Revisão concluída em 3 de setembro de 2026.

| Finalidade | Dados disponibilizados |
| --- | --- |
| Cozinha | Identificador, nome, itens e componentes, entrega ou levantamento, morada, horário e estado |
| Pedidos | Dados da cozinha, telefone, total, taxa, forma de pagamento e preços dos itens |
| Dashboard LOJA | Contagens de pedidos, pendentes e produtos |
| Dashboard ADMIN | Contagens e faturamento total |
| Conversas | Nome, telefone, estado, histórico permitido e estado do atendimento humano |
| Produtos | Campos do catálogo necessários para consulta e edição; `store_id` não é exposto |

A Cozinha usa `GET /api/orders/kitchen`, que exclui telefone, pagamento, total, preços, troco e metadados internos. A lista operacional de Pedidos mantém o resumo financeiro necessário para atendimento, mas exclui valor entregue, troco, identificador da loja, ator/chave/hash de envio manual e outros campos internos. A atualização de estado retorna somente identificador e novo estado.
