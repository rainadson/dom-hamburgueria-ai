# Validação final e dependências — 03/09/2026

O plano até TASK-0149 não está concluído. O deploy `730af65` foi confirmado como Live no Render. Não aplicar migrações nem ativar funcionalidades por inferência a partir de testes simulados.

| Bloco | Evidência disponível | Trabalho necessário |
|---|---|---|
| 0055, 0135–0137, 0139–0143 | Testes simulados de checkout, retirada, entrega, dinheiro, cartão, cancelamento e contexto | Validar transporte real e persistência em ambiente isolado; depois teste operacional autorizado |
| 0059, 0071, 0083–0092, 0147 | Imagem pronta, rascunho humano, parser/assinatura/persistência preparados | Meta App/número, banco validado, consumidor idempotente, envio e teste de ponta a ponta |
| 0081 | Confirmação manual com chave e recuperação de sessão | PostgreSQL isolado, aplicar migração somente após aprovação, ativação e teste operacional |
| 0093–0097 | Polling local, cancelamento e conflitos de estado | Supabase Realtime/permissões revistos e teste entre operadores; CAS por estado não é versão completa |
| 0100–0102 | Resumo copiável, DELIVERED existente | Clipboard/fluxo operacional; partilha real é ação explícita do atendente |
| 0103–0109, 0138 | Auditoria em configuracoes-pendentes.md | Dados oficiais da loja, horários, taxa e meios de pagamento; PIX não presumido |
| 0110–0122, 0145–0146 | Roles existentes e testes de rotas locais | Modelo multiloja, RLS/associações e revisão financeira; aprovação da correção de rotas públicas |
| 0124 | Concluída: arquivos atuais, histórico e regras de exclusão auditados; nenhum segredo real encontrado | Painéis/logs remotos e política de rotação permanecem como operação externa, sem evidência atual de exposição |
| 0125–0129, 0134, 0149 | Deploy antigo verificado, HTTPS nos serviços atuais | Publicar após aprovação, confirmar os dois deploys e testar novo estado; domínio próprio depende da escolha do utilizador |
| 0130–0133 | Erros HTTP seguros preparados | Correlação/monitorização, política de backups e restauração isolada; nenhum serviço comprado |
| 0144 | Handoff e pausa testados com simulações | Resposta humana real depende de WhatsApp e validação integrada |
| 0148 | Não executado | Carga básica somente em processo isolado com serviços simulados; não bombardear produção |

Próximos passos locais independentes: carga básica dos contratos de leitura em processo isolado e auditoria de arquivos versionados para verificar que .env não está incluído. Depois revisar o inventário, sem inventar novas tarefas para manter a automação ocupada. Não repetir pedidos de aprovação já enviados se não houver informação nova.
