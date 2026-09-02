# Testes de interpretação contextual

Execute na pasta `backend`:

```powershell
npm run build
node --test tests/conversation-context.test.cjs tests/upsell-completion.test.cjs tests/menu-orders.test.cjs tests/acai-toppings.test.cjs
```

Os testes locais usam o backend compilado, respostas simuladas da IA e repositórios em memória. Não gravam pedidos, não acessam o banco e não chamam o modelo.

Para verificar também o prompt com o modelo configurado:

```powershell
$env:RUN_AI_LIVE_TESTS = '1'
node --test tests/conversation-model.test.cjs
Remove-Item Env:RUN_AI_LIVE_TESTS
```

Essa verificação usa `GROQ_API_KEY` do ambiente ou de `backend/.env`, consome a cota da API e envia apenas um cardápio fixo e conversas fictícias. As oito chamadas são espaçadas em 22 segundos para reduzir erros de limite por minuto. Falhas HTTP 429 são limites do provedor, não resultados de interpretação; repita apenas os casos afetados quando houver cota.

Os casos cobrem oferta específica, quantidade, pergunta genérica, múltiplas opções, recusa, encerramento, ausência de histórico e contexto de morada. Os testes não validam WhatsApp, persistência real, autenticação ou deploy.

Os testes de açaí verificam o limite de dois toppings, opções válidas, preservação no recálculo e no payload do pedido, escolhas diferentes por item e exibição no resumo. Pedidos antigos sem esse campo permanecem compatíveis.
