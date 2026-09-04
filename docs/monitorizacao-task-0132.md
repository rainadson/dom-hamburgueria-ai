# TASK-0132 — monitorização de disponibilidade

Foi adicionada a rota pública `GET /health` para verificação de vida do processo HTTP.

Contrato:

- retorna HTTP 200 e `{ "status": "ok" }`;
- envia `Cache-Control: no-store`;
- não consulta Supabase, IA ou serviços externos;
- não devolve versão, configuração, pedidos ou dados de clientes;
- recebe o mesmo `X-Request-ID` das demais respostas.

Essa rota pode ser usada como Health Check Path no Render e por um monitor externo. A publicação do código é necessária antes de configurar o painel.

A parte versionada da TASK-0132 está concluída. Alertas com destino, frequência e retenção dependem de escolha operacional e configuração externa.
