# TASK-0120 — Proteção RLS dos dados operacionais

Revisão realizada em 3 de setembro de 2026.

Antes da correção, a chave pública do frontend conseguia consultar diretamente produtos, pedidos, conversas, itens, configurações e perfis. O frontend utiliza o Supabase somente para autenticação; os dados operacionais passam pela API autenticada do backend.

A migração `database/rls-core-migration.sql` habilita RLS e revoga os privilégios diretos de `anon` e `authenticated` nas tabelas operacionais existentes. Não cria políticas de leitura ou escrita no navegador. A `service_role`, guardada apenas no backend, mantém o acesso necessário para a aplicação.

Critérios de validação em produção:

- chave pública recebe acesso negado ao consultar qualquer tabela operacional;
- API pública de saúde continua disponível;
- endpoints operacionais sem sessão continuam retornando 401;
- painel autenticado continua carregando os dados pelo backend.

Esta tarefa protege a instalação atual como uma única loja. Associação de dados por loja e isolamento entre lojas pertencem à TASK-0121.
