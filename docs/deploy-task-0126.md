# TASK-0126 — deploy do frontend

## Estado verificado em 04/09/2026

- Aplicação: `https://dom-hamburgueria-ai.vercel.app`.
- Plataforma: Vercel com Vite + React Router.
- Configuração SPA: `frontend/vercel.json` reescreve todas as rotas para `index.html`.
- HTTP 200 confirmado em `/`, `/login`, `/dashboard`, `/orders` e `/conversations`.
- Uma rota desconhecida também entrega `index.html`; o React decide a navegação no cliente.
- A sessão já aberta continuou exibindo `/orders` em produção.
- Build local da Vite aprovado: 178 módulos transformados.

O build mantém um aviso não bloqueante: o arquivo JavaScript principal tem aproximadamente 545 kB antes de gzip. Divisão de código pode ser tratada como otimização de desempenho, sem relação com o antigo erro 404.

## Resultado

A TASK-0126 fica concluída. O frontend está publicado e o acesso direto às rotas do React funciona.
