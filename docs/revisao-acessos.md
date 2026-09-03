# Revisão de acessos — 03/09/2026

Análise estática do código local e do commit ee4763d, último deploy verificado. Não foram feitas requisições de exploração, consultadas conversas reais ou criados pedidos. Não há evidência aqui de exploração por terceiros.

## Achados prioritários

1. `app.ts` monta `/api/webhook` sem autenticação. `whatsapp/webhook.routes.ts` aceita telefone, chama `getOrCreate` e devolve o objeto inteiro `conversation`. O repository consulta `select("*")`. Consequência: conhecer um telefone pode permitir consultar histórico/rascunho sem login. Essa rota legada não valida assinatura Meta. Confirmado também no código de ee4763d.
2. `/api/chat` é público e chama o fluxo que pode criar pedidos. Não comprova identidade do remetente. Manter uma demonstração pública ligada a dados reais permite manipulação de conversas, consumo de IA e possíveis pedidos indevidos.
3. `/api/test-db` é público e devolve produtos integrais; falhas devolvem erro de banco sem filtragem.
4. `/api/orders` exige ADMIN/LOJA mas devolve `select("*")` para ambos. O filtro financeiro do Dashboard não cobre pedidos. A revisão de campos permitidos é pendente e deve preservar os valores necessários à revisão de pedidos manuais previamente autorizada.
5. RLS real, isolamento entre lojas e permissões do serviço não foram verificados. Esquema de referência não comprova segurança em produção.

## Correção proposta para aprovação

- Remover a montagem do webhook legado em produção. O webhook Meta novo continua desativado até validação de assinatura/persistência/consumo.
- Exigir a autenticação ADMIN/LOJA já existente em `/api/chat`, restringindo a demonstração a operadores autenticados. Uma demonstração pública futura precisa de dados isolados e limites próprios.
- Remover a montagem de `/api/test-db` em produção; o endpoint raiz de saúde permanece.
- Antes da publicação: testes HTTP locais garantindo que chamadas anónimas não alcancem serviços, que operadores autorizados continuem usando a demonstração e que a central de conversas funcione. Depois: validar recusas sem consultar dados reais.

Impacto: demonstração anónima e consumidores do webhook legado deixarão de funcionar. Não muda roles nem credenciais, mas restringe acesso atual a endpoints. A instrução autónoma proíbe alterar permissões; por isso esta restrição depende de aprovação explícita. Nenhuma das três mudanças foi aplicada neste bloco.

TASK-0117–0124 permanecem parciais. Publicação geral já tem aprovação pendente; este achado acrescenta uma decisão específica de segurança, não é uma nova tentativa de push.
