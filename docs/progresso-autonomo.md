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

## 03/09/2026 — TASK-0094 parcial: atualização da cozinha

Cozinha passa a reutilizar leituras coordenadas: consulta após três segundos, atualização ao recuperar foco, cancelamento ao sair e nova leitura após alteração de estado mesmo se outra consulta estiver em curso. Erros apresentam aviso mantendo dados anteriores. Corrigida deteção de novos IDs para avisar também quando a cozinha estava vazia ou o tamanho da lista permanece igual; primeira carga continua silenciosa. Áudio segue sujeito à autorização do navegador.

Validação local: testes de chegada de pedidos e ciclo de atualização, mais compilação frontend. Sem testes na cozinha real, sem pedidos, sem push. TASK-0094 continua parcial: consulta periódica implementada, Realtime e validação operacional ainda pendentes. Aprovação de publicação continua a mesma pendência já comunicada. Próximo bloco: rever atualização da central de conversas e estados entre telas (0095–0097), preservando rascunhos humanos.

## 03/09/2026 — TASK-0095 parcial: atualização das conversas

Lista e histórico reutilizam leituras coordenadas e atualizam ao recuperar foco. Histórico suspende consultas enquanto assumir/retomar/guardar resposta está em curso; respostas antigas são ignoradas e, após sucesso, o estado é novamente consultado. Falha dessa consulta fica visível sem apresentar o estado anterior como confirmação da ação. Texto digitado mantém-se durante atualizações e ações, limpando apenas ao trocar de conversa. Nenhuma resposta foi enviada.

Teste adicional cobre falha tardia de leitor substituído; quatro testes do ciclo aprovados e frontend compilado. Sem validação visual integrada neste bloco, nem publicação. TASK-0095 parcial: polling e proteção de concorrência locais, Realtime ainda pendente. Próximo: avaliar TASK-0096–0097 e dependências de Realtime, sem mudar permissões; publicação continua aguardando a aprovação já solicitada.

## 03/09/2026 — TASK-0096 parcial: confirmação de estado na cozinha

Ações de cozinha agora bloqueiam cliques repetidos no mesmo pedido durante a requisição, mostram Atualizando e apresentam erro no cartão quando a resposta não confirma a alteração. A lista é relida também após erro, porque uma falha de rede pode ocorrer depois da gravação. Não repete automaticamente escritas. As consultas periódicas de pedidos/cozinha/conversas ganham limite de 15 segundos para que uma leitura sem resposta não suspenda indefinidamente as próximas consultas.

Compilação frontend e testes locais do ciclo/chegada de pedidos aprovados. Nenhuma alteração de estado real executada. Isto não resolve concorrência entre operadores no backend nem implementa Realtime; 0096–0097 continuam parciais. Não foram alteradas permissões, publicações Supabase ou produção. Próximo: auditoria do contrato de atualização de estado para detetar conflitos entre operadores, antes de considerar sincronização concluída.

## 03/09/2026 — TASK-0096: conflitos de estado entre operadores

Atualização aceita expected_status e aplica comparação no mesmo UPDATE do banco. Se o estado já mudou, devolve 409 sem sobrescrever. Cozinha e modal enviam estado revisto; modal mostra falhas e impede repetição enquanto aguarda. IDs e estados passam por validação. Chamadores antigos sem expected_status continuam compatíveis, sem proteção contra concorrência; não foi criada regra nova de transições ou permissão. Comparação por estado não deteta cenário ABA (estado mudou e voltou ao mesmo valor).

Testes locais simulam disputa entre dois operadores e rejeição de entradas inválidas. Não substituem teste integrado em PostgreSQL. Builds backend/frontend e testes relevantes verificados; nenhuma mudança em pedidos reais ou publicação. Realtime segue pendente, não confundir CAS com eventos em tempo real. Próximo: consolidar auditoria 0093–0097 e seguir bloco de entrega existente, mantendo pendências externas explícitas.

## 03/09/2026 — conferência do roadmap original e entrega

Roadmap original recuperado da conversa Dom Ai (6a678d96-e8e4-83eb-8440-0f0cf5adce95). Correção de numeração dos registos acima: 0093 = Realtime Supabase; 0094 = atualizar pedidos; 0095 = atualizar cozinha; 0096 = atualizar conversas; 0097 = atualizar status. Os títulos anteriores deslocaram números; trabalho descrito continua válido, sem declarar 0093 concluída. Polling local cobre 0094–0097 parcialmente; Realtime/validação operacional pendentes.

0098 informações de entrega e 0099 mapa já presentes na cozinha: não refeitos. TASK-0100 preparada: botão copia resumo operacional para o atendente colar na conversa do entregador. Inclui nome, morada, itens/componentes e mapa; não inclui telefone, preços ou pagamento. Exige clique explícito e informa que nada foi enviado automaticamente. Entrega sem morada e retirada não oferecem cópia. Não é integração de envio WhatsApp.

Dois testes de composição/exclusão de campos e compilação frontend aprovados. Clipboard ainda não validado visualmente no navegador. Sem envios externos, pedidos ou publicação. 0101–0102: estado DELIVERED e ação final já existem; auditar fluxo de entrega antes de acrescentar estados novos. Próximo: revisar fase 14 (0103–0109), identificando decisões/configuração pendentes sem inventar dados da loja ou pagamentos.

## 03/09/2026 — auditoria de configurações e contrato HTTP de status

Fase 14 auditada em docs/configuracoes-pendentes.md: tabela settings só encontrada no SQL de referência, sem interface/rota; faltam dados oficiais, horário, regra de entrega e confirmação de meios de pagamento. Nenhuma configuração real alterada ou inventada. Multi-loja requer projeto/migração de associações e permissões, ainda pendentes.

Teste HTTP local do estado valida ausência/token inválido 401, ADMIN e LOJA 200, papel desconhecido 403, conflito 409 e erro interno sem detalhes de banco. Complementa testes de repositório; não chama produção nem valida RLS. Testes relevantes aprovados. Próximo: continuar auditoria 0117–0124 nos endpoints existentes e registar dependências de ativação sem repetir pedido de publicação.

## 03/09/2026 — revisão de acessos 0117–0124

Achado relevante: webhook legado público retorna conversa inteira por telefone; chat público processa o fluxo real; test-db público expõe produtos. Verificado estaticamente no código local e ee4763d, sem exploração em produção. Proposta concreta em docs/revisao-acessos.md: desativar montagem do webhook legado/test-db e exigir autenticação existente no chat. Isto restringe acessos e pode afetar demo anónima, portanto depende de aprovação explícita dado o limite de não alterar permissões. Utilizador notificado. Nenhuma restrição aplicada ou push realizado.

Separadamente, pedidos devolvem campos financeiros para ambas as roles; regras operacionais precisam de revisão antes de filtrar. RLS/multiloja permanecem não verificados. Próximo trabalho independente: validação de entradas/erros existentes sem mudar autorização e auditoria de logs/configuração sem revelar secrets.

## 03/09/2026 — TASK-0123 parcial: entrada do chat

Chat e webhook legado rejeitam objetos/arrays/números em telefone ou mensagem, valores vazios e tamanhos acima de 20/4000 caracteres antes de chamar serviços. Texto válido permanece intacto; não normaliza identidades existentes. Erros inesperados do chat deixam de devolver detalhes do provedor e de imprimir objeto completo nos logs. Não altera autenticação nem corrige o acesso público já comunicado.

Build backend e teste HTTP local aprovados, com serviços simulados: entradas inválidas não alcançam persistência, texto válido preservado e falhas sem detalhe privado. Sem chamadas de IA/banco real ou produção. Próximo: revisar erros restantes e logs; alterações de autorização e publicação continuam aguardando as aprovações solicitadas.

## 03/09/2026 — TASK-0130/0131 parcial: erros e logs

Adicionado tratamento final de erros Express com JSON genérico para falhas inesperadas e respostas claras para JSON inválido/corpo demasiado grande. Pedidos/test-db/Dashboard deixam de devolver objetos de erro internos; produtos deixam de imprimir erros completos. Removidos logs de arranque de URL/presença de chave Supabase (não havia impressão do valor da chave). Dashboard agora rejeita falhas de consulta em vez de mostrar contagens/faturamento zero como se fossem dados válidos.

Build backend e dois testes HTTP locais aprovados: exceção assíncrona, JSON inválido, limite de corpo e indicadores indisponíveis. Nenhuma alteração em credenciais/permissões/produção. Isso não substitui observabilidade com correlação, backup nem revisão completa de secrets; os acessos públicos continuam aguardando autorização específica. Próximo: consolidar testes locais e inventário de dependências restantes, com revisão de validação visual e produção pendente.

## 03/09/2026 — verificação consolidada após tratamento de erros

Suíte completa executada com backend compilado: 139 casos, 131 aprovados, 8 externos ignorados, zero falhas. Verificação real de tipos frontend com tsconfig.app.json aprovada; a chamada inicial sobre tsconfig.json raiz não verificava fontes por conter apenas references. README dos testes atualizado para evitar falsa validação futura. Sem nova publicação ou execução de modelos.

Pendências materiais mantidas: autorização de publicação e restrição de rotas públicas, Meta/numero, banco isolado para migrações, dados/regras da loja, RLS/multiloja, backup/monitorização e validação final real. Ainda há trabalho local seguro: validação visual isolada dos componentes modificados e revisão de inputs de produtos. Próximo bloco: visualização local com dados fictícios, sem usar autenticação ou API de produção.

## 03/09/2026 — componentes de cozinha no navegador local
Página temporária carregou KitchenOrderCard real com dois pedidos fictícios, sem importar API/autenticação. Árvore de acessibilidade confirmou: itens/observação/morada/mapa e botão de cópia na entrega; retirada sem mapa/cópia; aviso de falha visível e botão Atualizando desativado. Telefone e valores não aparecem. Isto valida renderização/semântica no navegador; não inclui screenshot, avaliação responsiva completa, clipboard real ou alterações de estado.
Servidor local encerrado e os dois arquivos temporários removidos. Produção, mensagens e pedidos reais intocados. Próximo: validação de entradas do CRUD de produtos, preservando o payload da interface e catálogo atual; aprovações anteriores continuam pendentes.


## 03/09/2026 — TASK-0123 parcial: validação de produtos

CRUD valida IDs positivos, nome/preço obrigatórios na criação, campos textuais e booleano ativo; preço finito não negativo com duas casas e limite do NUMERIC(10,2). Atualizações parciais continuam aceites; metadados do payload da interface (id/created_at) não são regravados. Descrição limitada a 4000 caracteres. Erros de entrada retornam 400 e são apresentados no modal. Nenhum preço, produto ou permissão real alterado.

Três testes locais cobrem payload completo da interface, entradas inválidas e validação antes de mutação; backend/frontend compilados. Não cobre nomes duplicados nem regras de alteração conjunta de hambúrguer/Menu; não inventadas neste bloco. Próximo: verificar contrato HTTP e consolidar pendências de produção e testes finais, sem publicar enquanto aprovação estiver pendente.

## 03/09/2026 — contrato HTTP de produtos e inventário final

Teste HTTP local confirmou 400 para entradas inválidas antes de qualquer escrita e compatibilidade de criação, atualização parcial e payload completo da interface, sem regravar id/created_at. Quatro testes de produtos aprovados no conjunto. Nenhum produto real alterado. Inventário em docs/validacao-final-pendente.md diferencia testes locais, integração real, publicação e dependências até 0149; plano não concluído.

Próximo: carga básica local com dependências simuladas (0148) e auditoria de arquivos versionados (0124), sem produção e sem leitura/exposição de valores secretos. Aprovações de publicação e acesso continuam pendentes.

## 03/09/2026 — TASK-0124 e 0148 parciais

Auditoria de nomes rastreados não encontrou env/chaves/certificados nomeados; referências de ambiente documentadas em exemplos sem valores, mantendo service role somente no backend e envio manual false. Limites em docs/revisao-secrets.md: histórico, deploy, logs e rotação não verificados.

Carga básica isolada: 200 leituras de produtos e 200 chats inválidos, em lotes paralelos de 20, com repositório em memória; todas leituras 200, entradas 400 e zero chamadas ao serviço de conversa. A primeira tentativa com 400 conexões simultâneas excedeu o ambiente local Windows e falhou com conexão recusada; não contou como resultado da aplicação. Não mede latência nem substitui carga do banco/Render/Meta; produção não foi acessada. TASK-0148 parcial. Próximo: executar suíte consolidada após os últimos contratos e rever se resta trabalho independente de baixo risco antes de aguardar aprovações/dependências.

## 03/09/2026 — encerramento do trabalho independente e pausa
Verificação final local: backend compilado; 144 casos, 136 aprovados, 8 externos ignorados, zero falhas. Frontend passou na verificação de tipos com tsconfig.app.json e no build Vite (mantido aviso de bundle acima de 500 kB). Branch limpa após commit a confirmar e 21 commits locais à frente de origin/main; produção continua no ee4763d.

Neste ponto, blocos restantes exigem informação/autorização ou estado externo: aprovação para publicar os commits locais; decisão para restringir webhook/test-db/chat públicos; Meta App/número e teste real; PostgreSQL isolado e aprovação de migrações/ativação manual; dados/regras da loja e pagamento; decisões/migrações de multiloja/RLS; domínio, backup e monitorização; validações reais finais. Não há mais implementação independente de baixo risco que cumpra requisitos existentes sem inventar configuração ou alterar permissões. Automação pausada conforme instrução, sem declarar o plano concluído. Retomar após respostas/aprovações usando docs/validacao-final-pendente.md.


## 03/09/2026 — TASK-0117: rotas antigas protegidas com autorização

Após autorização explícita, removida montagem de test-db e webhook legado; chat real agora exige requireAuth ADMIN/LOJA. Demo frontend já era protegida e envia sessão Supabase. Teste HTTP local cobre recusas, papéis autorizados e 404 dos legados, sem banco/IA reais. Nenhuma role, credencial ou RLS alterada. Próximo: suíte/build, commit/push e verificação de deploy; não testar chat válido em produção para não criar conversa ou consumir IA.

## 03/09/2026 — TASK-0118: matriz ADMIN/LOJA

Criado middleware requireRole. Leitura do catálogo permanece para ambos por ser usada no pedido manual; criação/edição/exclusão ficam ADMIN, com 403 para LOJA. Interface oculta Produtos e redireciona acesso direto de LOJA, mas segurança está no backend. Pedidos/cozinha, conversas/handoff, demo e status WhatsApp permanecem para ambos conforme uso operacional e decisão anterior. Matriz e limites em docs/permissoes-admin-loja.md.

Testes locais cobrem LOJA lendo sem gravar e ADMIN nas três mutações. Ainda falta TASK-0122 para respostas financeiras por finalidade e TASK-0120/0121 para RLS/multiloja; não consideradas concluídas aqui. Próximo: builds/suíte, publicação e validação de 403 sem mutação real.

## 03/09/2026 — TASK-0120: RLS dos dados operacionais

Confirmado em produção que a chave pública conseguia consultar diretamente `products`, `orders`, `conversations`, `order_items`, `settings` e `user_profiles`. Aplicada migração idempotente que habilita RLS e revoga os privilégios de `anon` e `authenticated` nas tabelas operacionais existentes, sem criar políticas de acesso direto pelo navegador. O backend mantém acesso por `service_role`, guardada apenas no servidor.

Após a migração, todas as seis consultas com chave pública retornaram 401. A API de saúde permaneceu 200 e o painel LOJA autenticado continuou carregando os indicadores pelo backend. O esquema de criação também passa a habilitar RLS e revogar acesso público por padrão. Nenhum registro, pedido, produto ou autenticação foi alterado. Isolamento multiloja permanece na TASK-0121.

## 03/09/2026 — TASK-0121: estrutura e isolamento multiloja

Criada a tabela `stores` e associadas as tabelas operacionais e os perfis atuais à Dom Hamburgueria por `store_id` obrigatório. A migração foi aplicada com sucesso em produção, preservando todos os registros. Telefones de conversas passam a ser únicos por loja, permitindo o mesmo cliente em lojas diferentes.

O backend agora obtém a loja do perfil autenticado e filtra por ela produtos, pedidos, clientes derivados, conversas, handoff e indicadores; criações recebem a mesma loja. Perfil sem loja válida é recusado. Locks de conversa também incluem a loja. Não foi criada uma segunda loja nem interface de gestão. Testes simulam duas lojas e confirmam filtros distintos; validação final de build, publicação e produção segue neste bloco.

## 03/09/2026 — TASK-0122: respostas por finalidade

A Cozinha passa a usar resposta própria sem telefone, pagamento, totais, preços, troco ou metadados internos. Pedidos mantém telefone e resumo financeiro necessários ao atendimento, excluindo valor entregue, troco, `store_id` e campos internos de idempotência. Atualização de estado devolve apenas ID/estado; catálogo deixa de expor `store_id`. Dashboard já restringia faturamento ao ADMIN e Conversas já excluía o rascunho integral.

Contratos puros verificam os campos permitidos e proíbem dados privados em cada resposta. Backend e frontend compilados; suíte completa com 146 aprovações, 8 testes externos ignorados e zero falhas. Próximo: publicação e validação das telas Pedidos/Cozinha em produção sem alterar pedidos.

## 03/09/2026 — TASK-0123: validação consolidada de entradas

Concluída a revisão das entradas do chat, produtos, pedidos manuais, atualização de estado e conversas. IDs recebidos na URL agora aceitam somente inteiros positivos canónicos e seguros; valores como `1e2`, decimais, sinais, listas e objetos são recusados antes de consultar ou alterar dados. Página e busca de conversas deixam de converter ou truncar silenciosamente entradas inválidas; a busca limita tamanho e caracteres que poderiam interferir na sintaxe do filtro.

Matriz completa registrada em `docs/validacao-entradas-task-0123.md`. Backend compilado e suíte completa aprovada: 156 casos, 148 aprovados, 8 integrações externas ignoradas e zero falhas. Nenhum dado real foi criado ou modificado. Próximo: publicar e conferir saúde e telas autenticadas em produção, sem alterar pedidos.

## 04/09/2026 — TASK-0124: auditoria de segredos

Verificados os arquivos atuais e todo o histórico Git por nomes sensíveis e padrões de chave, token, conexão e chave privada, sem imprimir valores. Nenhum `.env`, certificado, chave privada ou credencial real está versionado. Os dois `.env.example` contêm somente placeholders; URLs e tokens encontrados nos testes são fictícios. `SUPABASE_SERVICE_ROLE_KEY` permanece lida somente pelo backend.

O `.gitignore` agora bloqueia variantes `.env.*`, certificados, chaves e arquivos comuns de credenciais, preservando `.env.example`. A TASK-0124 está concluída no escopo do repositório. Painéis, logs remotos e política de rotação são operações externas e não foram inferidos como falha sem evidência de exposição. Próximo: TASK-0125, conferência do pipeline/deploy.

## 04/09/2026 — TASK-0125: deploy do backend

Confirmado no Render que o commit `730af65` está Live no serviço Node ligado à branch `main`. Os comandos versionados compilam TypeScript e iniciam `dist/server.js`; a porta usa `process.env.PORT`. A consulta pública à raiz da API retornou HTTP 200 com JSON. O serviço é configurado no painel, sem `render.yaml` versionado.

Nenhuma variável secreta foi exibida ou alterada e nenhum endpoint de escrita foi chamado. A TASK-0125 está concluída para o backend atual. Próximo: TASK-0126, deploy do frontend na Vercel.

## 04/09/2026 — TASK-0126: deploy do frontend

Confirmados HTTP 200 em `/`, `/login`, `/dashboard`, `/orders` e `/conversations` na Vercel. O rewrite SPA de `frontend/vercel.json` entrega `index.html` também em acesso direto, corrigindo o 404 original; a sessão autenticada já aberta continua exibindo `/orders`. O build local da Vite aprovou 178 módulos.

Permanece apenas o aviso não bloqueante de bundle principal com cerca de 545 kB antes de gzip. A TASK-0126 está concluída. Próximo: TASK-0127, inventário das variáveis necessárias por ambiente sem exibir valores.

## 04/09/2026 — TASK-0127: contrato de ambientes

Conferidos, somente pelos nomes, os contratos de ambiente do Render e da Vercel. Backend usa `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `MANUAL_ORDER_SUBMIT_ENABLED` e `PORT`; frontend usa apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Os exemplos versionados cobrem o conjunto correto e não contêm valores reais.

Removido o arquivo órfão `backend/src/config/supabase.ts`, que não era importado e referenciava a variável antiga `SUPABASE_KEY`. Nenhum valor de painel foi exibido ou alterado. A TASK-0127 está concluída no contrato versionado. Próximo: TASK-0128, domínio público.

## 04/09/2026 — TASK-0128 parcial: domínio público

Frontend e backend funcionam nos endereços padrão HTTPS da Vercel e do Render. Não existe domínio próprio escolhido ou documentado. Para permitir a troca futura sem editar código, o frontend agora aceita `VITE_API_URL`, mantendo a API atual do Render como fallback compatível.

A preparação técnica está concluída, mas o domínio próprio depende da escolha e registro pelo proprietário. Até lá, os endereços padrão permanecem oficiais. Próximo trabalho independente: TASK-0129, verificação HTTPS e cabeçalhos básicos.

## 04/09/2026 — TASK-0129: HTTPS e cabeçalhos

Render e Vercel responderam em HTTPS com HSTS. O backend já inclui CSP, proteção de frame e `nosniff` pelo Helmet. O frontend passa a declarar em `vercel.json` `nosniff`, bloqueio de frame, política de referência e bloqueio de câmera/microfone/geolocalização, recursos não usados pela aplicação.

Não foi imposta CSP no frontend sem validação das origens necessárias para Supabase e API. A TASK-0129 está concluída no código; os novos cabeçalhos da Vercel precisam ser confirmados depois da publicação. Próximo: TASK-0130, tratamento seguro de erros, já preparado parcialmente e agora a consolidar.

## 04/09/2026 — TASK-0130: respostas de erro seguras

Consolidado o tratamento para JSON inválido, corpo excessivo, endpoint inexistente, falha inesperada e indisponibilidade de dados. Respostas 500 não incluem stack, objeto do banco ou detalhe do provedor. Corrigido o último caminho encontrado: conteúdo bruto e inválido devolvido pelo modelo deixa de ser reenviado ao usuário e passa a gerar orientação genérica.

Erros de entrada conhecidos preservam mensagens específicas. A TASK-0130 está concluída; correlação e monitorização seguem nas tarefas seguintes.

## 04/09/2026 — TASK-0131: correlação segura de logs

Cada requisição passa a receber UUID gerado no backend, devolvido em `X-Request-ID`. Logs genéricos de falha inesperada, produtos e chat incluem esse identificador, permitindo localizar o evento sem registrar telefone, mensagem, pedido, morada, token ou credencial.

O identificador não é aceito do cliente e não altera regras ou respostas de negócio. Persistência, alertas e retenção de logs seguem no bloco de monitorização. A TASK-0131 está concluída.

## 04/09/2026 — TASK-0132: monitorização de disponibilidade

Adicionada `GET /health`, rota pública, sem cache e sem consulta a banco, IA ou dados operacionais. Retorna apenas `{status:"ok"}` e pode ser usada pelo Health Check do Render ou monitor externo. Teste confirma o contrato e ausência de dados adicionais.

A parte versionada está concluída. Ativar alertas exige publicação e escolha de destino/frequência no serviço externo; isso não foi inventado. Próximo: TASK-0133, política de backup e restauração.

## 04/09/2026 — TASK-0133 parcial: backup e restauração

Criado procedimento que cobre dados operacionais, associação por loja, autenticação, catálogo e migrações. Antes de alterações de esquema, exige confirmação de backup e exportação cifrada fora do Git. A restauração deve ocorrer primeiro em Supabase/PostgreSQL isolado, com conferência de relações, contagens e RLS.

Nenhum dado foi exportado ou restaurado. A TASK-0133 permanece parcial até confirmar a política disponível no plano Supabase e executar restauração isolada; recuperação sobre produção exige autorização e janela de manutenção. Próximo trabalho independente: TASK-0134, revisão do lançamento atual.

## 04/09/2026 — TASK-0134: revisão de lançamento

Revisado o pacote desde `730af65`: não contém migração de banco nem mudança de cardápio/pedidos. Backend e frontend compilaram; suíte backend executou 156 casos, com 148 aprovados, 8 integrações externas ignoradas e zero falhas. `git diff --check` aprovado. O aviso do bundle Vite permanece não bloqueante.

Checklist pós-publicação registrado em `docs/release-task-0134.md`: confirmar Render/Vercel, `/health`, raiz da API, `/login`, tela autenticada e cabeçalhos. A TASK-0134 está concluída como revisão; publicação depende de autorização explícita por acionar produção.
