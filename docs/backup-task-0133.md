# TASK-0133 — backup e restauração

## Escopo a proteger

- Supabase/PostgreSQL: `stores`, `products`, `orders`, `order_items`, `conversations`, `settings`, `user_profiles` e tabelas futuras do WhatsApp quando ativadas.
- Configuração de autenticação e perfis associados às lojas.
- Catálogo e migrações versionados em `database/` servem como referência de estrutura, mas não substituem os dados reais.
- A imagem pública do cardápio já está versionada no frontend.

## Procedimento antes de alterações de banco

1. Confirmar no painel Supabase que existe backup recuperável e registrar a data, sem copiar credenciais para documentos.
2. Exportar esquema e dados pelo mecanismo oficial da plataforma ou `pg_dump`, guardando o arquivo cifrado em local controlado fora do Git.
3. Registrar qual commit e quais migrações correspondem ao backup.
4. Aplicar mudanças aditivas e idempotentes somente após revisão.

## Teste de restauração

1. Criar um projeto PostgreSQL/Supabase isolado.
2. Restaurar o backup nesse projeto, nunca diretamente sobre produção.
3. Conferir contagens por tabela, relações entre pedido e itens, perfis/lojas e unicidade de conversas por loja.
4. Reaplicar/verificar RLS e confirmar que `anon` e `authenticated` não leem tabelas operacionais diretamente.
5. Executar testes de leitura da API apontando para o ambiente isolado.
6. Apagar de forma controlada o ambiente temporário após a validação e o prazo definido.

## Recuperação real

Uma restauração em produção interrompe ou substitui dados e exige autorização explícita, janela de manutenção, identificação do ponto de recuperação e plano para pedidos recebidos depois desse ponto.

## Estado

O procedimento está preparado, mas a TASK-0133 permanece parcial até confirmar a política de backup disponível no plano Supabase e executar uma restauração em ambiente isolado. Nenhum dado real foi exportado, alterado ou restaurado nesta tarefa.
