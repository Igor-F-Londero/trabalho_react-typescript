# Frontend — Tarefas

Interface em React + TypeScript (Vite, Tailwind CSS e Recharts) para a API de tarefas (`../trabalho_1_crud_backend`).

> Guia completo para instalar e usar o sistema inteiro, com capturas de tela: [README da raiz](../README.md).

Funcionalidades: cadastro/login (sessão por cookie `HttpOnly`), árvore de grupos e subgrupos (aninhamento livre) com tarefas dentro, e criar/editar/mover/excluir grupos e tarefas.

- **Arrastar e soltar** (mouse, toque e teclado) para mover tarefas e grupos; soltar em "Sem grupo" tira do grupo. Ciclos de grupos são bloqueados.
- **Busca e filtros** por texto (sem acento), status, prioridade e atrasadas, além de ordenação.
- **Resumo** com progresso e contagem de atrasadas; contador por grupo.
- Atualizações **otimistas** (React Query) com rollback e avisos (toasts) em caso de erro.
- **Clareza:** saudação com o nome do usuário e descrição da tarefa visível na linha. Os botões de ação mostram **só o ícone** que representa a ação (pasta com "+", pasta com degrau, caixa com visto e "+", lápis, lixeira, disquete, seta de voltar, setas circulares, "i", tabela, porta com seta, sol/lua). O nome exato fica no `aria-label` e no `title` (dica ao passar o mouse) de `BotaoIcone`; a tela de login mantém o texto.
- **Botões animados:** ao passar o mouse ou focar com o Tab, a parte do ícone que faz a ação se mexe (a tampa da lixeira abre, o lápis escreve, o "+" gira, a seta da porta sai, o visto se desenha, as setas circulares giram); o botão sobe com um brilho e "afunda" ao clicar, e os botões que aparecem de repente entram com um "pop". As partes animadas têm classe própria em `Icone.tsx` e essas animações ficam em `src/index.css`; `prefers-reduced-motion` desliga tudo.
- **Formulários:** todos os campos com rótulo visível; Enter salva e Esc cancela.
- **Estados:** tela inicial orientando o primeiro passo quando não há dados, e os grupos recolhidos são lembrados no navegador (`localStorage`, chave `grupos-recolhidos`).
- **Desfazer exclusão:** ao excluir uma tarefa ou um grupo (inclusive "excluir tudo"), o item some na hora e um aviso oferece **Desfazer** por 6 s. O `DELETE` só é enviado depois desse prazo; desfazendo, nada vai ao servidor. Sair da conta confirma as exclusões pendentes antes de encerrar a sessão. Limitação: se a aba for fechada ou recarregada dentro dos 6 s, a exclusão não acontece e o item volta.
- **Página `/resumo`:** avanço geral por importância em um gráfico radial, três **números-chave** (concluídas/total, tarefas por mês, concluídas por mês) e três gráficos do **Recharts**: barras por mês (**% feito** × **% por importância**, média ponderada: alta vale 3, média 2, baixa 1), evolução (tarefas do mês × concluídas) e rosca por prioridade. Passar o mouse mostra os valores; a explicação (botão "i") e a tabela detalhada (botão de tabela) só aparecem sob demanda. No celular, onde os meses não cabem, o gráfico de barras abre rolado até o mês atual. A página busca `GET /tarefas/resumo-mensal` ao abrir e se atualiza quando as tarefas mudam; é carregada sob demanda (`React.lazy`), então o Recharts só é baixado ao abri-la.
- **Rotas:** `/login` (pública), `/` (tarefas) e `/resumo`, as duas últimas dentro de `AreaLogada`, que faz a guarda de sessão e mostra o `Cabecalho` (navegação, tema e sair).
- **Dados legíveis nas tarefas:** prioridade por extenso (Alta, Média, Baixa) e data identificada como "Prazo 10/11/2026" ou "Atrasada · 01/10/2026".
- **Responsivo:** layout ajustado para telas estreitas, com recuo reduzido nos grupos aninhados.
- **Tema claro e escuro:** botão sol/lua (na tela de login e no topo do dashboard) com a escolha guardada no navegador (`localStorage`, chave `tema`); sem escolha, segue o sistema. As cores são declaradas em `@theme` com `light-dark()` em `src/index.css` (viram utilitários do Tailwind) e o `data-tema` do `<html>` força um dos lados.
- **Tailwind CSS 4** (plugin `@tailwindcss/vite`): estilos com classes utilitárias no JSX, e as repetições viram componentes (`Botao`, `BotaoIcone`, `Etiqueta`) ou constantes em `components/estilos.ts`. Fonte do sistema e cartões simples.

## Autenticação

O backend grava o JWT em um cookie `HttpOnly`; o frontend nunca o lê nem o guarda no `localStorage`. Toda requisição usa `credentials: 'include'` (`src/services/api.ts`), e o navegador envia o cookie sozinho.

- O estado de login vem de `GET /auth/me` (`src/hooks/useSessao.ts`); enquanto não responde, nada é renderizado, para não piscar o login.
- **Entrar** chama `POST /auth/login` e recarrega a sessão; **Sair** chama `POST /auth/logout` e limpa o cache.
- Um 401 em qualquer requisição derruba a sessão e leva ao login.
- O backend só aceita a origem definida em `FRONTEND_URL` (padrão `http://localhost:5173`). Se mudar a porta do Vite, ajuste essa variável no backend. Front e API devem ficar no mesmo site (ex.: `localhost`) por causa do `SameSite=Lax`.

Estrutura: `src/pages` (telas: login, tarefas e resumo), `src/components` (componentes reutilizáveis; `graficos/` guarda os gráficos do Recharts), `src/hooks` (dados e estado: sessão, árvore, avisos, resumo, exclusão com desfazer), `src/services` (cliente da API) e `src/lib` (tipos e funções puras: árvore, arrastar e soltar, resumo mensal, exclusões adiadas, tema) e `src/test-utils` (dados de exemplo dos testes).

## Executar

Requer **Node.js 22.22 ou superior** (o React Router 8 e o Vitest 5 exigem).

```bash
# 1. Backend rodando (ver README do backend): docker compose up -d && npm run dev
# 2. Frontend
npm install
cp .env.example .env     # VITE_API_URL aponta para a API
npm run dev              # http://localhost:5173
```

| Variável       | Descrição       | Padrão                  |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | URL base da API | `http://localhost:3000` |

Build: `npm run build`. Testes: `npm test` (184: API, fluxo de sessão no `App`, funções puras e componentes, inclusive o ícone de cada botão). Lint: `npm run lint`.
