# TASK-0134 — revisão de lançamento

## Pacote preparado

Base de produção: `730af65`.

O pacote local contém:

- exclusão reforçada de arquivos com segredos;
- comprovação dos deploys do Render e Vercel;
- contrato de variáveis e remoção de configuração Supabase órfã;
- URL da API configurável no frontend;
- cabeçalhos de segurança da Vercel;
- respostas de erro seguras;
- `X-Request-ID` e correlação de logs sem dados pessoais;
- `GET /health` sem acesso a dados;
- procedimentos de domínio, monitorização e backup.

## Verificação final

- `git diff --check`: aprovado.
- Build backend: aprovado.
- Testes backend: 156 casos, 148 aprovados, 8 integrações externas ignoradas, nenhuma falha.
- Build frontend: aprovado; permanece aviso não bloqueante do bundle principal de aproximadamente 545 kB.
- Nenhuma migração de banco.
- Nenhum pedido, produto, conversa ou configuração real foi modificado durante a validação.

## Após publicação

1. Confirmar os deploys do Render e Vercel.
2. Consultar `/health` e a raiz da API.
3. Confirmar `/login` e uma tela autenticada sem executar ações de escrita.
4. Conferir os novos cabeçalhos da Vercel.
5. Configurar o Health Check Path do Render como `/health`.

A TASK-0134 fica concluída como revisão. A publicação requer autorização explícita por acionar produção.
