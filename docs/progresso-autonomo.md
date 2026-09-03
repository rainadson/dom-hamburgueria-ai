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


## 03/09/2026 — TASK-0074–0080: preparação local

Implementado serviço de prévia e formulário /orders/new: cliente/telefone, produtos ativos, quantidades, observações, bebida de Menu, até dois toppings ou escolha explícita sem toppings, entrega/levantamento, Dinheiro/Multibanco e troco. O backend ignora preços e totais enviados e calcula pelo catálogo. Observações são preparadas no formato exibível pela cozinha. A taxa de entrega permanece zero e o formulário informa essa limitação; taxas configuráveis pertencem ao bloco 0103–0109.

Quatro testes novos aprovados: adulteração de preço, troco/observações, requisitos de Menu/açaí e entradas inválidas. Nenhum pedido gravado. 0075 (selecionar cliente já existente) ainda pendente; nome/telefone podem ser preenchidos manualmente. 0081 (gravar/enviar à cozinha) não implementada: precisa de confirmação explícita no formulário e idempotência persistente antes de liberar envio. Todo o bloco continua parcial, local e não publicado; permanece o bloqueio de push da revisão automática. Próxima execução: seleção de cliente e estratégia de persistência/idempotência, sem alterações de permissões e sem testes na cozinha real.


## 03/09/2026 — TASK-0075: seleção de cliente

Adicionada busca autenticada de clientes em pedidos anteriores, com resposta limitada a nome/telefone, exclusão de identificadores fictícios, deduplicação por número e seleção no formulário. Busca exige dois caracteres, limita 100 pedidos correspondentes e mostra até 20 clientes distintos; não é um cadastro completo nem garante cobertura de todo o histórico. O operador também pode preencher cliente novo manualmente. Consultas canceladas ao trocar busca para evitar resultados antigos.

Teste unitário verifica deduplicação, prioridade do registo mais recente e ausência de dados financeiros. Continuação local: não há push autorizado após a recusa automática. TASK-0081 permanece pendente de persistência idempotente; não introduzir envio baseado apenas em bloqueio de botão ou memória do servidor. Próximo passo: preparar alteração aditiva de esquema e contrato de criação; validar sem gravar pedidos reais.


## 03/09/2026 — TASK-0081: contrato de confirmação preparado, desativado

Criado endpoint de confirmação autenticado com confirmação explícita, recálculo de catálogo, verificação do total revisto e chave UUID por envio/operador. Nova persistência usa três colunas opcionais e índice único em orders para impedir duplicação em concorrência/repetição. Alteração SQL em database/manual-submit-migration.sql está SOMENTE preparada: não aplicada nem validada num PostgreSQL real. Endpoint permanece desativado por padrão (MANUAL_ORDER_SUBMIT_ENABLED ausente); nenhuma variável de produção foi modificada.

Cinco testes locais simulam repetição, concorrência com conflito único, preço alterado, reutilização indevida e perda da resposta após inserção. Esses testes não substituem a validação da migração real. Ainda falta ligar a confirmação à interface e preservar a chave no navegador após resultado incerto. Não habilitar antes de ambos estarem prontos e validados. Nenhum pedido real foi criado. Publicação permanece bloqueada pela revisão automática.


## 03/09/2026 — interface de confirmação manual

Ligada a interface ao contrato desativado: o botão de envio só aparece se o backend anunciar capacidade ativa. Revisão/checkbox obrigatórios; envelope com UUID e dados revistos é guardado em sessionStorage por utilizador ANTES da chamada. Em erro ou recarregamento, preserva o mesmo envio e bloqueia alterações para reduzir duplicação. Recuperação limita-se ao mesmo separador/sessão; fechar o separador pode perder o registo local, embora o banco retenha chaves já gravadas. Validação de migração, teste integrado PostgreSQL e ativação continuam pendentes. Não habilitar apenas porque a interface está pronta.

Próximo bloco independente: inspecionar integração WhatsApp 0082–0092, preparar contratos/testes locais sem enviar mensagens ou mudar credenciais. Pedidos manuais e atendimento humano não foram publicados devido ao bloqueio de aprovação previamente registado.

## Autorização de publicação — 03/09/2026
O utilizador autorizou explicitamente publicar os cinco commits pendentes após ser informado do bloqueio. A autorização mantém o envio manual desativado até validar o banco. Validação final: 104 testes locais aprovados, backend e frontend compilados. Não aplicar a migração nem habilitar MANUAL_ORDER_SUBMIT_ENABLED nesta publicação.



## 03/09/2026 — publicação e TASK-0082

Após confirmação explícita do utilizador, os cinco commits anteriores foram publicados (ee4763d), com 104 testes aprovados e deploy Vercel/Render verificado. Prévia em produção devolveu Dom Tradicional €8,99 e confirmou envio manual desativado. A restrição antiga de publicação foi resolvida para aquele bloco; manter desativado o envio manual até validar o banco, conforme instrução do utilizador.

TASK-0082: tela informativa WhatsApp e endpoint autenticado para ADMIN/LOJA implementados localmente. Mostra explicitamente que não há ligação real, recebimento/envio/mídia pendentes e acesso ao cardápio já publicado. Não lê ou expõe tokens, não infere conexão da existência de variáveis, não modifica o webhook legado e não envia mensagens. Ainda não é um painel de configuração.

0083/0084/0090 dependem da conta/app/número Meta do utilizador. Próxima execução pode preparar 0085–0089 com documentação oficial atual, transporte desativado, testes locais de assinatura e tratamento de mensagens, antes de solicitar a configuração externa. Não reutilizar o webhook legado como se estivesse integrado à Meta. Publicação desta tela ainda não realizada.


## 03/09/2026 — TASK-0085: receção autenticada preparada

Fábrica de webhook Meta implementada e testada localmente, NÃO montada em app.ts: verificação GET, assinatura HMAC-SHA256 sobre bytes originais, limites de corpo, validação básica do envelope e resposta 200 apenas após persistência bem-sucedida. Sem callback de persistência durável, responde 503 até à verificação GET. Não lê credenciais reais e não encaminha nada à IA ou cozinha.

Fontes primárias consultadas: [documentação do SDK mantido originalmente pela Meta](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/) descreve challenge e assinatura; o SDK está arquivado e NÃO foi instalado. [Coleção oficial Meta no Postman](https://www.postman.com/meta/whatsapp-business-platform/folder/lboq68h/webhooks) confirma a necessidade de configuração de Webhooks no Meta App. Implementação local usa módulos Node/Express já existentes, sem depender de versão Graph API.

Próximo: persistência da caixa de entrada com ID de evento/mensagem, deduplicação e processamento recuperável. Antes de montar, configurar o caminho antes de express.json e verificar assinatura no ambiente real. Não reconhecer entregas com 200 sem armazenamento durável. 0085 permanece parcial e 0086–0089 ainda sem transporte ativo. Nenhuma alteração de conta, token, permissão ou produção nesta execução.


## 03/09/2026 — caixa de entrada WhatsApp preparada

Criado armazenamento de envelopes assinados com hash canónico, inserção que ignora duplicados sem sobrescrever estado e propagação de falha de banco para impedir confirmação de recebimento prematura. Três testes locais cobrem identidade, tamanho/formato, duplicação e indisponibilidade. SQL proposto em database/whatsapp-inbox-migration.sql; não aplicado. Inclui RLS sem políticas de navegador e precisará de revisão antes de qualquer execução; nenhuma permissão real foi alterada.

Isto deduplica envelopes equivalentes, NÃO garante processamento único de cada mensagem em envelopes distintos. Ainda faltam deduplicação por ID da mensagem, consumo recuperável com lease, transação de efeitos e coordenação com envio. Não ligar MetaInbox ao webhook nem confirmar configuração externa enquanto o consumidor estiver ausente. O estado da integração continua não conectado. Próximo: contratos de normalização e IDs de mensagens com documentação primária; manter integrações e migrações desativadas.


## 03/09/2026 — normalização de mensagens Meta

Preparado parser puro de lotes: separa textos recebidos de recibos de entrega, exige WABA e phone_number_id esperados, preserva ID/remetente/timestamp, deduplica IDs equivalentes dentro do lote e rejeita conflitos. Mídia e outros tipos são identificados como não processáveis: não são convertidos em pedidos por legenda. Envelope original permanece na caixa de entrada proposta. Sem execução de IA, download ou resposta.

Referências primárias: [payload oficial Meta](https://www.postman.com/meta/whatsapp-business-platform/folder/vzaxn16/webhook-payload-reference) e [exemplo oficial de texto](https://www.postman.com/meta/whatsapp-business-platform/request/yw0wjm1/received-text-message-with-show-security-notifications). Cinco testes locais verificam lotes, IDs, isolamento de destino, mídia e dados inválidos. Não equivale a integração real nem prova suporte a todos os tipos atuais de mensagem.

Próximo passo: armazenamento de IDs normalizados e consumidor com recuperação/efeitos idempotentes. Não ligar ao chat atual enquanto ele puder gravar pedidos antes de confirmar o processamento do evento na mesma transação. Permanecem pendentes conta Meta, número, migrações e validação externa; o código novo continua local.


## 03/09/2026 — armazenamento por ID de mensagem preparado

Proposta SQL separada para gravar IDs normalizados e concluir extração do envelope numa transação. Reentregas em envelopes diferentes preservam a mensagem existente e o seu estado; conteúdo conflitante causa rollback do lote. Mídia fica UNSUPPORTED. Adaptador isolado exige envelope previamente persistido e propaga falhas, sem chamar IA ou cozinha. Não está ligado ao webhook.

Migração NÃO aplicada: regras de acesso apenas propostas, sem alteração de permissões reais. Testes do adaptador cobrem identidade estável entre envelopes, falha de armazenamento e validação antes da chamada. Não provam transações/concor­rência PostgreSQL: essas verificações continuam pendentes numa base de testes. Ainda faltam consumidor, efeitos atómicos e transporte; COMPLETED do envelope representa apenas extração, não atendimento da mensagem. Próximo: validar esquema num PostgreSQL isolado disponível e desenhar consumo sem repetir efeitos.

## 03/09/2026 — verificação consolidada e publicação pendente
Frontend compilado; suíte local: 117 testes aprovados, 8 testes externos ignorados, zero falhas. Backend compilado no bloco anterior. Docker instalado mas serviço indisponível mesmo após verificação autorizada; migrações continuam sem validação PostgreSQL real.
Tentativa de push dos cinco commits WhatsApp até dab284e rejeitada pela revisão automática: autorização anterior limitada aos cinco commits já publicados. Nova aprovação solicitada ao utilizador, sem contorno do bloqueio. Produção permanece ee4763d. Transporte e migrações continuam inativos. Trabalho local independente pode continuar enquanto a publicação aguarda.


## 03/09/2026 — TASK-0093 parcial: atualização de pedidos

Enquanto publicação/Meta/banco aguardam dependências, avançado bloco independente do plano. A lista de pedidos só carregava ao abrir; agora consulta a cada cinco segundos após terminar a leitura e ao recuperar foco. Atualização após mudança de estado é preservada mesmo com leitura em curso; desmontagem cancela a requisição e ignora resultados tardios. Erros mantêm a lista anterior e mostram aviso. Mantém API autenticada existente e permissões. Modal aberto conserva a revisão do operador; não substitui os seus campos durante edição.

Isto é consulta periódica, não Supabase Realtime: TASK-0093 permanece parcial. Três testes cobrem sobreposição, desmontagem e recuperação. Sem pedidos reais, sem publicação e sem nova tentativa de contornar bloqueio. Próximo: aplicar coordenação equivalente à cozinha e avaliar atualização de estados entre telas.
