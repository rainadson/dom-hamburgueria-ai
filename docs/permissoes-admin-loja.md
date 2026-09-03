# Matriz de permissões — TASK-0118

| Recurso | ADMIN | LOJA |
|---|---|---|
| Dashboard operacional | Ler | Ler |
| Faturamento agregado | Ler | Não recebe |
| Pedidos e cozinha | Ler/alterar estado | Ler/alterar estado |
| Pedido manual | Preparar; confirmação depende de ativação | Preparar; confirmação depende de ativação |
| Conversas e handoff | Operar | Operar, conforme decisão explícita anterior |
| Demonstração autenticada | Usar | Usar |
| Estado da integração WhatsApp | Ler | Ler |
| Catálogo de produtos | Ler | Ler para pedidos/catálogo |
| Criar/editar/excluir produtos | Permitido | Proibido (403 e interface oculta) |

O backend decide usando o perfil consultado pelo token; não confia em role enviada pelo frontend. A proteção visual apenas evita oferecer ações proibidas. Rotas futuras não recebem permissão automaticamente.

Limites: valores dos pedidos e catálogo ainda são necessários nos fluxos operacionais atuais e serão tratados na TASK-0122 com respostas próprias por finalidade; RLS e multiloja permanecem TASK-0120/0121. ADMIN não pode tomar handoff pertencente a outro operador, conforme regra de responsabilidade já implementada.
