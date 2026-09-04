# TASK-0128 — endereços públicos e domínio

## Estado atual

- Frontend: `https://dom-hamburgueria-ai.vercel.app`.
- Backend: `https://dom-hamburgueria-ai.onrender.com`.
- Ambos responderam por HTTPS na validação de produção.
- Não há domínio próprio documentado ou configurado no repositório.

O frontend passou a aceitar `VITE_API_URL`, mantendo a API atual do Render como fallback. Assim, um domínio futuro pode ser configurado na Vercel sem nova alteração de código.

## Dependência externa

A parte técnica versionada está preparada, mas a TASK-0128 só pode ser encerrada como domínio próprio depois que o proprietário escolher e registrar o domínio. A configuração seguinte será feita nos painéis da Vercel, Render e DNS, sem colocar credenciais no Git.

Até essa decisão, os endereços padrão continuam sendo os endereços oficiais e funcionais da aplicação.
