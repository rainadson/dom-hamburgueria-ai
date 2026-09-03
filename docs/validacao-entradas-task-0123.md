# TASK-0123 — validação de entradas HTTP

## Limites aplicados

| Entrada | Regra |
| --- | --- |
| Telefone do chat | texto não vazio, até 20 caracteres |
| Mensagem e rascunho | texto, até 4000 caracteres |
| ID em rotas | inteiro positivo canónico e seguro; não aceita expoente, decimal, sinal, objeto ou lista |
| Página de conversas | inteiro não negativo e seguro; ausência equivale à primeira página |
| Busca de conversas | texto simples, até 100 caracteres; letras, números, espaço e `+@._-` |
| Produto | nome até 150, categoria até 100, descrição até 4000, preço finito e compatível com `NUMERIC(10,2)`, ativo booleano |
| Pedido manual | estrutura validada, 1 a 50 linhas, quantidade de 1 a 99, morada e observações até 500; totais calculados no servidor |
| Estado de pedido | ID válido, estado conhecido e estado esperado validado quando enviado |

O tratamento global também devolve erro claro para JSON inválido e para corpos acima do limite padrão do servidor. As rotas protegidas continuam a exigir autenticação antes de chegar a estas validações.

## Verificação

- Compilação do backend aprovada.
- Suíte completa: 156 casos, 148 aprovados, 8 integrações externas ignoradas e nenhuma falha.
- Casos específicos cobrem expoentes (`1e2`), decimais, zero, negativos, números acima do limite seguro, listas, objetos, busca longa e caracteres próprios da sintaxe de filtro.

Nenhum produto, preço, pedido, conversa ou permissão de produção foi alterado durante os testes.
