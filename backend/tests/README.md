# Testes locais do Dom AI

Execute na pasta `backend`:

```powershell
npm run build
node --test tests/*.test.cjs
```

Os testes locais usam o backend compilado, respostas simuladas da IA e repositórios em memória. Alguns abrem servidores HTTP apenas em 127.0.0.1. Não gravam pedidos reais, não acessam o banco e não chamam o modelo. Mantenha RUN_AI_LIVE_TESTS ausente para que os oito testes externos sejam ignorados.

A suíte inclui catálogo/checkout, atendimento humano, pedidos manuais, contratos HTTP, preparação Meta, atualização de telas e resumo de entrega. Os testes de SQL são simulações de contrato: migrações ainda precisam de PostgreSQL isolado.

Para verificar os tipos da interface, a partir da raiz do repositório:

```powershell
frontend/node_modules/.bin/tsc.cmd --noEmit -p frontend/tsconfig.app.json
npm --prefix frontend run build
```

A configuração raiz tsconfig.json só contém referências; executar tsc sem build sobre ela não verifica o código da aplicação. O build Vite também não substitui essa verificação de tipos.

Em 03/09/2026: 131 testes passaram, oito testes externos foram ignorados e a verificação de tipos da interface passou. Isso não comprova deploy, RLS, WhatsApp, banco real ou funcionamento visual no navegador.

Para verificar também o prompt com o modelo configurado:

```powershell
$env:RUN_AI_LIVE_TESTS = '1'
node --test tests/conversation-model.test.cjs
Remove-Item Env:RUN_AI_LIVE_TESTS
```

Essa verificação usa `GROQ_API_KEY` do ambiente ou de `backend/.env`, consome a cota da API e envia apenas um cardápio fixo e conversas fictícias. As oito chamadas são espaçadas em 22 segundos para reduzir erros de limite por minuto. Falhas HTTP 429 são limites do provedor, não resultados de interpretação; repita apenas os casos afetados quando houver cota.

Os casos cobrem oferta específica, quantidade, pergunta genérica, múltiplas opções, recusa, encerramento, ausência de histórico e contexto de morada. Os testes não validam WhatsApp, persistência real, autenticação ou deploy.

Os testes de açaí verificam o limite de dois toppings, opções válidas, preservação no recálculo e no payload do pedido, escolhas diferentes por item e exibição no resumo. Pedidos antigos sem esse campo permanecem compatíveis.
