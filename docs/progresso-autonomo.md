# Progresso autónomo — Dom AI

## 03/09/2026 — TASK-0068 a TASK-0073

Implementado localmente e validado com 91 testes:
- 0068: botão Assumir atendimento para ADMIN/LOJA.
- 0069/0070: assumir pausa o processamento automático; mensagens recebidas ficam no histórico, sem resposta IA, escolha automática ou criação de pedido.
- 0072: retomar devolve o processamento à etapa anterior. Mensagens acumuladas não são executadas automaticamente.
- 0073: responsável é o ID autenticado, com papel e horário. Eventos internos ficam no histórico e são excluídos das mensagens enviadas ao modelo. Outro atendente não pode sobrescrever a responsabilidade.
- 0071 PARCIAL: preparar/guardar resposta local, explicitamente NÃO ENVIADA. Envio manual ao cliente depende da integração Meta; nenhum envio foi simulado.

Persistência: metadados em order_draft.handoff; ações de painel atualizam rascunho e eventos numa única operação. Não houve mudança de esquema, credenciais ou permissões. Retomada preserva o rascunho atual; metadados podem ser substituídos depois pelo checkout, e os eventos no histórico mantêm o registo do responsável.

Concorrência: fila por telefone partilhada entre chat e painel na instância Node. Testados dois atendentes simultâneos, operação repetida, falha com libertação de fila e independência entre telefones. Antes de múltiplas réplicas/processos ou integração Meta com reentregas, substituir por coordenação transacional/distribuída e idempotência persistente. Não declarar resolução de concorrência distribuída.

Validações: backend e frontend compilados; 91 testes locais aprovados com modelo/banco simulados. Nenhuma mensagem enviada a clientes e nenhum pedido enviado à cozinha nesta execução. Validação interativa de assumir/responder/retomar em produção ainda pendente; não assumir conversas reais durante ausência do utilizador.

Próximo bloco: TASK-0074–0081, pedido manual. Antes de implementar, conferir schema real dos pedidos e contratos existentes. Implementar com testes locais; não enviar pedidos de teste à cozinha. Pendências anteriores: 0055/0059 e envio de imagem/respostas no WhatsApp dependem de 0082–0092.

A quota interrompeu a validação anterior. Retomada bem-sucedida às 03:20 UTC; não foram comprados créditos nem usados resets.

Publicação bloqueada: a revisão automática recusou o comando que incluía push para main, por considerar insuficiente a autorização para impacto em produção e remoto não verificado. Não contornar nem repetir o push sem aprovação explícita posterior à informação do bloqueio. Guardar e validar localmente é a alternativa de menor risco; continuar outros blocos localmente enquanto o utilizador estiver ausente. Esta implementação ainda não foi publicada.
