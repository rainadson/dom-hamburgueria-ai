# Consolidação das TASK-0135 a TASK-0148

Validação executada em 04/09/2026, excluindo integração real do WhatsApp.

| Task | Cobertura verificada | Estado |
| --- | --- | --- |
| 0135 | checkout só grava depois da confirmação final | concluída |
| 0136 | entrega + dinheiro, valor entregue e troco | concluída |
| 0137 | retirada + Multibanco, sem morada ou etapa de dinheiro | concluída |
| 0138 | horário, taxa de entrega e meios oficiais configuráveis | pendente de dados oficiais da loja |
| 0139 | cancelamento em todas as etapas sem criar pedido | concluída |
| 0140 | resposta negativa preserva o rascunho | concluída |
| 0141 | contexto atual prevalece sobre ofertas antigas | concluída |
| 0142 | encerramento de upsell/menu não confirma checkout por engano | concluída |
| 0143 | resumo de entrega exclui telefone e dados financeiros | concluída |
| 0144 | handoff ADMIN/LOJA preserva checkout, bloqueia tomada por outro operador e não simula envio | concluída |
| 0145 | autorização de papéis e conflito de estado entre operadores | concluída |
| 0146 | isolamento por loja e RLS das tabelas operacionais | concluída |
| 0147 | transporte real Meta/WhatsApp | adiada por instrução do proprietário |
| 0148 | carga básica isolada | concluída |

## Evidência

O conjunto focado executou 60 testes com 60 aprovações e nenhuma falha. A carga isolada fez 200 leituras paralelas do catálogo e 200 chats inválidos em lotes de 20; todas as leituras responderam 200, todas as entradas inválidas responderam 400 e nenhuma chamou o serviço de conversa.

Os testes usam repositórios simulados ou servidor local. Eles comprovam as regras e ausência de efeitos colaterais, mas não substituem o teste operacional final da TASK-0149.

## Pendências externas

Para concluir a TASK-0138 são necessários horário oficial, regra/taxa de entrega e confirmação dos meios aceitos. Não foi presumido PIX nem criada taxa. A TASK-0147 será retomada somente na etapa específica de ligação do WhatsApp.
