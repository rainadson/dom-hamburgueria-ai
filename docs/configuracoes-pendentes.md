# Configurações da loja — auditoria de 03/09/2026

TASK-0103–0109 não estão concluídas. A referência `database/schema.sql` contém `settings`, mas não há serviço, rota ou página implementados para essa tabela. O link de configurações continua marcado como futuro. Não foi consultado ou alterado o esquema de produção; o SQL antigo não prova que a tabela real tenha esses campos.

| Task | Evidência atual | Falta para ativar |
|---|---|---|
| 0103 Dados da hamburgueria | Nome Dom Hamburgueria consta no cardápio | Morada e contacto oficiais; confirmar tabela real e acesso de edição |
| 0104 Horário | `opening_hours` apenas no SQL de referência | Horários/dias/fuso e comportamento do atendimento fora do horário |
| 0105 Taxa | Pedido manual aceita apenas zero; não há consulta a settings | Valor/regra real e aplicação consistente ao checkout e resumo |
| 0106 PIX | Campo `pix_key` apenas no SQL antigo | Confirmar aplicabilidade: cardápio em euros, sem chave fornecida |
| 0107 Pagamento | Fluxo atual tem dinheiro/cartão | Meios efetivamente aceites e configuração validada sem simular recebimento |
| 0108 Mensagens da IA | Mensagens no código | Editor, persistência e limites, sem permitir modificar preço ou autorização via texto |
| 0109 Personalidade | Prompt atual existente | Configuração limitada que preserve regras de pedido e conteúdo do catálogo |

Nenhum valor de taxa, horário, contacto ou meio de pagamento foi inventado. Não foi criado formulário que indique gravação sem persistência. Multi-loja (0110–0116) depende ainda de modelo de associação/permissões e migração; mudanças reais de permissões permanecem fora da autorização de execução autónoma.

Próximos trabalhos independentes: testes e revisão dos endpoints existentes (0117–0124), preparação do contrato de configurações sem ativação, e inventário final de dependências. A publicação local já foi solicitada separadamente e não deve ser tentada por outro caminho enquanto a aprovação estiver pendente.
