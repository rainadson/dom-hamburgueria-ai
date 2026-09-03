# TASK-0121 — Estrutura e isolamento multiloja

Cada perfil autenticado passa a pertencer obrigatoriamente a uma loja. O backend propaga esse identificador e limita por `store_id` produtos, pedidos, conversas, clientes derivados, indicadores e operações de atendimento humano.

A migração `database/multistore-migration.sql` cria o cadastro de lojas, associa os dados e utilizadores atuais à Dom Hamburgueria e troca a unicidade global do telefone por unicidade dentro de cada loja. A loja existente mantém todos os seus dados.

O navegador não recebe acesso direto à tabela de lojas. A separação é aplicada na API mesmo usando a `service_role`, que por definição ignora RLS. Um perfil sem loja válida é recusado no login do painel.

Esta tarefa prepara várias lojas no mesmo banco. Não cria uma segunda loja, não cria utilizadores e não adiciona uma interface de gestão de lojas.
