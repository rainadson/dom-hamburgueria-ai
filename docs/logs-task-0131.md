# TASK-0131 — correlação segura de logs

Cada requisição recebe um UUID gerado pelo backend. O identificador é devolvido em `X-Request-ID` e incluído nos logs genéricos de falhas inesperadas, produtos e chat.

O identificador:

- não vem do cliente;
- não contém telefone, mensagem, pedido, token ou endereço;
- permite relacionar uma resposta HTTP com o evento correspondente no log;
- não muda o conteúdo das respostas nem as regras de negócio.

Logs estruturados persistentes, alertas e retenção pertencem às tarefas de monitorização. Esta tarefa fornece apenas a correlação mínima e segura dentro do serviço atual.

A TASK-0131 fica concluída.
