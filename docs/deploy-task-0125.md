# TASK-0125 — deploy do backend

## Estado verificado em 04/09/2026

- Serviço Render: `dom-hamburgueria-ai`.
- Repositório/branch: `rainadson/dom-hamburgueria-ai`, `main`.
- Runtime: Node.
- Comandos do projeto: `npm run build` compila TypeScript e `npm start` executa `dist/server.js`.
- Porta: fornecida por `process.env.PORT`, com fallback apenas para execução local.
- Último commit verificado: `730af65`.
- Estado do deploy no painel: **Live**.
- Consulta pública `GET /`: HTTP 200 com JSON.

O serviço é configurado diretamente no painel do Render; não existe `render.yaml` no repositório. Nenhuma variável ou valor secreto foi lido ou alterado nesta verificação.

## Resultado

A TASK-0125 fica concluída para o backend atual. A verificação comprova construção, publicação e resposta HTTP do serviço; não testa escrita de pedidos, conversa com IA ou integrações externas.
