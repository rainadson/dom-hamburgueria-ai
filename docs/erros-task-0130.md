# TASK-0130 — respostas de erro seguras

## Comportamento consolidado

- JSON inválido retorna HTTP 400 com mensagem clara.
- Corpo acima do limite retorna HTTP 413.
- Endpoint inexistente sob `/api` retorna HTTP 404 em JSON.
- Falha inesperada retorna HTTP 500 genérico, sem stack, mensagem do banco ou detalhe do provedor.
- Rotas de produtos, pedidos, conversas, Dashboard e chat usam mensagens operacionais sem devolver objetos internos.
- Resposta inválida da IA não é mais reenviada como texto bruto; o usuário recebe orientação genérica para tentar novamente.
- Erros de entrada conhecidos continuam retornando mensagens específicas e seguras.

Os logs atuais registram somente categorias genéricas de falha. Identificadores de correlação e monitorização pertencem às tarefas seguintes.

## Verificação

Os testes HTTP cobrem exceção assíncrona, JSON malformado, corpo demasiado grande e falha do Dashboard, confirmando que detalhes marcados como privados não aparecem na resposta.

A TASK-0130 fica concluída.
