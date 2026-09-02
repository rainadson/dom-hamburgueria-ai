# Central de Conversas — TASK-0060 a TASK-0067

Disponível em /conversations para utilizadores autenticados ADMIN e LOJA. Inclui lista paginada (30 por página), busca por telefone/nome do rascunho atual, histórico, estado e atualização automática por consultas periódicas (lista 10s, histórico 5s). Não usa Supabase Realtime; integração por eventos permanece no bloco 0093–0097.

A API não retorna order_draft, totais estruturados ou mensagens de sistema. O histórico exibe as mensagens do cliente e da IA, incluindo preços citados na própria conversa; restrições financeiras do Dashboard permanecem inalteradas. Não há endpoints de escrita nesta etapa.

Limites: nomes existentes apenas no rascunho deixam de estar disponíveis depois que ele é limpo; nesse caso a identificação é pelo telefone. Mensagens legadas não possuem horário individual nem anexos persistidos. Multiloja ainda não existe: acesso corresponde à instalação atual de uma loja. Atendimento manual, pausa e retomada da IA serão implementados em 0068–0073.

Validação: compilação frontend/backend e teste HTTP local para autenticação, papéis ADMIN/LOJA, busca e formato seguro de resposta.
