# Registro de alterações por categoria

Resumo do que compõe o projeto **API de Tarefas e Grupos** (Express 5 + MongoDB/Mongoose + Zod + JWT em cookie) e o frontend que a consome, organizado por categoria. O repositório git (na raiz do projeto) ainda não tem commits, então este registro foi montado a partir do estado atual do código, do `roadmap.md` e do `README.md`, e não do histórico de commits.

## Infraestrutura (infra)

- **Docker Compose** (`docker-compose.yml`): MongoDB 7 com volume persistente `mongo_data`. A API roda opcionalmente em container pelo profile `app`: `docker compose --profile app up -d --build`.
- **Dockerfile multi-stage**: o estágio de build compila o TypeScript e o estágio final usa só dependências de produção (`npm ci --omit=dev`). Usa `node:22-alpine` e roda como usuário não-root (`USER node`).
- **Health check**: rota `GET /health` devolve 200 com o banco conectado e 503 sem ele. É usada pelo `HEALTHCHECK` do Dockerfile.
- **`.dockerignore`** para reduzir o contexto de build.
- **CI** (`.github/workflows/ci.yml`, na raiz do repositório): GitHub Actions com Node 22 e cache do npm, com um job para o backend (`lint`, `typecheck` e `test`) e outro para o frontend (`lint`, `build` e `test`), em push e pull request. Um push novo cancela a execução anterior da mesma branch.
- **Variáveis de ambiente**: `.env.example` documentado e `config/env.ts` tipado. O `docker-compose` exige `JWT_SECRET` (`${JWT_SECRET:?...}`).
- **`.gitignore`**, **`.prettierignore`** e **`.prettierrc.json`**.

## Backend

- **Arquitetura em camadas**: rota → auth → validação → controller → service → model, com erros tratados de forma centralizada.
  - Controllers só tratam HTTP.
  - Services concentram a regra de negócio.
- **Recursos**:
  - `/auth`: registro, login, `GET /auth/me` e `POST /auth/logout`.
  - `/tarefas`: CRUD com filtros `status`, `prioridade` e `grupo`, e `GET /tarefas/resumo-mensal`.
  - `/grupos`: CRUD, mais `GET /grupos/arvore`.
- **Grupos aninhados**:
  - Hierarquia de profundidade limitada a `MAX_PROFUNDIDADE = 10` (`depthOf` e `subtreeOf` em `group.service.ts`).
  - Bloqueio de ciclos ao mover um grupo (`subtreeOf`).
  - Exclusão em cascata com `?cascata=true`.
  - Exclusão de grupo não vazio retorna 409.
- **Modelos Mongoose** (`User`, `Group`, `Task`): `timestamps`, índices em `pai`, `usuario` e `grupo`, e `email` único e em minúsculas.
- **Tratamento de erros** (`errorHandler.ts`):
  - Classe `AppError`.
  - 404 para rota inexistente.
  - JSON malformado → 400.
  - `CastError` → 400.
  - Chave duplicada `E11000` → 409 (cobre cadastro concorrente).
  - Demais erros → 500.
- **Validação** (Zod, em `schemas/`):
  - Body e query validados, com tipos inferidos (`z.infer`) nos services.
  - A query validada vai em `res.locals.query`, porque no Express 5 `req.query` é somente leitura.
- **Documentação da API**: Swagger/OpenAPI em `/docs` (`config/swagger.ts`).
- **Separação `app.ts` / `server.ts`**: o app pode ser testado sem abrir porta.
- **Dependências**: Express 5, Mongoose 9, Zod 4, bcryptjs, jsonwebtoken, TypeScript 6.

## Frontend

- **`trabalho_2_frontend`**: SPA em React 19 + TypeScript (Vite), com React Router, TanStack Query e `@dnd-kit`.
  - Login e cadastro, dashboard com a árvore de grupos e tarefas, arrastar e soltar, busca, filtros e resumo.
  - Atualizações otimistas com rollback e avisos (toasts).
  - UX: botões só com ícone (ver a seção "Botões animados" abaixo), saudação com o nome do usuário, descrição da tarefa visível, formulários com rótulos visíveis (Enter salva, Esc cancela), tela inicial para quem não tem dados e grupos recolhidos lembrados no navegador. Conferido visualmente nos temas claro e escuro e em tela de celular (390 px).
  - **Desfazer exclusão** de tarefas e grupos: exclusão adiada por 6 s (`lib/exclusoes.ts`), item oculto na tela enquanto isso (`ocultarIds`) e aviso com botão "Desfazer". Sair da conta confirma as pendentes. Se a aba fechar nesse intervalo, a exclusão não é enviada.
  - Visual padrão (fonte do sistema, cartões, tema claro e escuro com botão e escolha lembrada), sem imagens de fundo nem fontes externas.
  - **Sessão por cookie**: `fetch` com `credentials: 'include'`, sem `localStorage`. O estado de login vem de `GET /auth/me` (`hooks/useSessao.ts`), sair chama `POST /auth/logout` e um 401 em qualquer requisição leva ao login.
  - Testes com Vitest e Testing Library (166 no total: `api`, `App`, `arvore`, `arrasto`, `exclusoes`, `tema`, `resumoMensal` e os componentes, entre eles `Icone`, `AlternarTema`, `AnelProgresso`, `GraficoMensal`, `TabelaMensal`, `ResumoMensal`, `TarefaLinha`, `TarefaForm`, `NomeForm`, `ConfirmButton` e `Filtros`).

## Segurança

- **Autenticação JWT** (`middlewares/auth.ts`): aceita o token no cookie `token` ou em `Authorization: Bearer`, valida e injeta `req.userId`. Sem token válido → 401.
- **Cookie de sessão**: `HttpOnly` (o JavaScript não lê, mitigando roubo por XSS), `SameSite=Lax` (mitiga CSRF) e `Secure` em produção. `POST /auth/logout` o apaga.
- **CORS restrito**: só a origem `FRONTEND_URL` é liberada, com `credentials: true`. Outras origens não recebem cabeçalhos CORS.
- **Senhas** com hash bcrypt. Nunca armazenadas em texto puro.
- **`JWT_SECRET` obrigatório em produção**: a aplicação não sobe sem ele (sem fallback `dev-secret`).
- **Helmet** para cabeçalhos HTTP seguros.
- **Rate limit** (`express-rate-limit`) em `POST /auth/login` e `POST /auth/register`: 20 tentativas a cada 15 min por IP, contra força bruta. `GET /auth/me` e `POST /auth/logout` não contam (ver "Correção do limite de tentativas"). Fica desligado em `NODE_ENV=test`.
- **Isolamento entre usuários**: todas as consultas filtram pelo `usuario` dono. O `assertGroupOwned` impede usar o grupo de outro usuário.
- **Validação de entrada** com Zod. IDs do Mongo são validados e inválidos viram 400.
- **Container não-root** (`USER node`).

## Qualidade de código e testes

- **ESLint** (`eslint.config.js`) com typescript-eslint e `eslint-config-prettier`.
- **Prettier** e script `npm run format`.
- **Scripts**: `dev`, `build`, `start`, `seed`, `test`, `typecheck`, `lint` e `format`.
- **Testes** (Vitest + Supertest + `mongodb-memory-server`):
  - Arquivos: `auth`, `cookies`, `groups`, `tasks`, `summary`, `ratelimit`, `seed-dados` e `hardening` (89 testes).
  - O teste de cookies foi escrito antes da implementação (TDD).
  - Cobrem CRUD, 404, ID inválido, isolamento entre usuários, ciclos de grupos, query inválida, cadastro concorrente e helmet.
  - Usam banco em memória e não sujam o banco de desenvolvimento.

## Usabilidade (da API / de quem a consome)

- **Respostas de erro padronizadas**: JSON com mensagem e `details` (ex.: "Dados inválidos").
- **Swagger com botão Authorize** para testar rotas protegidas direto no navegador.
- **Filtros** em `/tarefas` (`status`, `prioridade`, `grupo`, com `grupo=nenhum` para tarefas soltas) e em `/grupos` (`pai=raiz`).
- **Árvore completa** em uma chamada (`GET /grupos/arvore`: grupos > subgrupos > tarefas).
- **Atualização parcial** (PUT) de tarefas.
- **Mensagens de erro em português**.
- **Swagger** documenta `/auth/me` e `/auth/logout` e explica o uso do token no Authorize.
- **Documentação**: `README.md` (execução, variáveis, endpoints, estrutura) e `roadmap.md` (fluxo de uma requisição e papel de cada arquivo).

## Acessibilidade

- A API em si não tem interface; o Swagger UI usado em `/docs` é o padrão da biblioteca. O frontend em `trabalho_2_frontend` usa `aria-label` nos campos e botões de ícone e `role="alert"` nos erros, mas não passou por auditoria de acessibilidade.

## Resumo mensal por média ponderada — concluído

1. **Backend:** `GET /tarefas/resumo-mensal` (`?ano=` opcional), com `summary.service.ts`. Agrupa pelo mês do prazo e devolve por mês e no geral o total, as concluídas, a taxa simples e a **taxa ponderada pela prioridade** (alta 3, média 2, baixa 1), além das médias de tarefas e de concluídas por mês e de quantas tarefas ficaram de fora por não terem prazo. Documentado no Swagger.
2. **Frontend:** bloco recolhido "Resumo mensal" no dashboard (`ResumoMensal.tsx`): busca só ao abrir, mostra uma tabela por mês com as duas taxas e o geral, explica os pesos e se atualiza quando as tarefas mudam. Conferido em desktop claro e celular escuro.
3. Escrito com TDD: 15 testes no backend e 13 no frontend antes da implementação.
   - **Clareza para o usuário** (rodada seguinte): colunas "% feito" e "% por importância" no lugar de "Conclusão" e "Ponderada"; frase-resumo no topo; detalhe das concluídas por prioridade em cada mês; marcação de "mês atual" e "ainda não começou"; legenda explicando os percentuais e os pesos. Na lista, prioridade por extenso (Alta, Média, Baixa) e "Prazo" antes da data. 9 testes novos escritos antes da implementação.
4. **Premissas:** o mês vem do **prazo** (não há data de conclusão guardada) e os pesos 3/2/1 são uma escolha minha, fácil de trocar em `PESOS`.

## Tema claro/escuro e resumo mensal visual — concluído

1. **Tema claro e escuro com botão:** antes o app só seguia o tema do sistema, então quem usa o sistema escuro nunca via o claro. Agora há um botão sol/lua (no login e no topo do dashboard), a escolha fica no `localStorage` (chave `tema`) e, sem escolha, vale o tema do sistema. As cores usam `light-dark()`, o que eliminou o bloco duplicado de variáveis do modo escuro, e um script em `index.html` aplica o tema antes da primeira pintura. Escrito com TDD (`tema.test.ts`, `AlternarTema.test.tsx`).
2. **Resumo mensal mais visual:** o parágrafo e a tabela deram lugar a um anel de progresso animado, três cartões de números e um gráfico de barras por mês (% feito × % por importância), feitos em SVG e CSS, sem biblioteca. A explicação e a tabela continuam disponíveis sob demanda ("Como é calculado" e "Tabela detalhada"). Cada coluna do gráfico tem descrição completa para leitores de tela e é navegável pelo teclado. Componentes novos: `AnelProgresso`, `GraficoMensal` e `TabelaMensal`, cada um com testes escritos antes.
3. Um defeito apareceu só na conferência visual, não nos testes: o gráfico usava a classe `.barra`, que já pertencia à barra de progresso do topo, e as duas se estragaram mutuamente. A do gráfico foi renomeada para `.grafico-barra`.
4. Frontend: 130 testes (eram 96). Backend inalterado (73).

## Botões animados só com ícone e seed com histórico — concluído

1. **Botões sem texto:** todas as ações do dashboard (novo grupo, novo subgrupo, nova tarefa, editar, excluir e confirmar, salvar, cancelar, desfazer, tentar de novo, "como é calculado", tabela detalhada, sair) mostram só o ícone que as representa. Seis ícones novos (`subpasta`, `salvar`, `desfazer`, `recarregar`, `info`, `tabela`) e um `tarefaMais` redesenhado (caixa com visto e "+"). O `BotaoIcone` perdeu a prop `texto`; o `rotulo` vira `aria-label` e `title`. O botão de ação do aviso ("Desfazer") ganhou o campo `icone`. A tela de login manteve o texto, porque ali o botão é o próprio formulário. Testes escritos antes: cada ação precisa ter o ícone certo, nenhum texto visível e o nome acessível (`Icone.test.tsx`, `App.test.tsx`, `ResumoMensal.test.tsx`).
2. **Animação:** o CSS anima a parte do ícone que realiza a ação (tampa, seta, "+", visto, aba do disquete…) no hover e no foco do teclado; o botão sobe com brilho, afunda ao clicar e os que surgem entram com "pop". Tudo em CSS puro, desligado por `prefers-reduced-motion`. Conferido em um Firefox real dirigido por WebDriver BiDi, com hover de verdade.
3. **Seed com 8 meses de histórico:** a lógica foi extraída para `src/seed-dados.ts` (árvore de exemplo + `gerarHistorico`), sem sorteios e relativa à data de hoje (7 meses passados e o seguinte, 4 a 7 tarefas por mês, taxas de conclusão diferentes). Escrito antes com testes (`tests/seed-dados.test.ts`), inclusive a virada de ano e a leitura pelo `GET /tarefas/resumo-mensal`. O gráfico passou de 2 para 9 colunas.
4. **Defeito achado só no navegador real:** com 9 meses o gráfico passou a rolar na horizontal no celular e abria escondendo o mês atual. Agora ele abre rolado até o mês em destaque (teste simulando o layout), e a barra de rolagem usa as cores do tema.
5. Prints do README refeitos no Firefox real (2x) e nova legenda dos ícones. Testes: frontend 166 (eram 130) e backend 84 (eram 73).

## Correção do limite de tentativas — concluída

1. **Defeito:** o limitador estava em todas as rotas de `/auth`, inclusive `GET /auth/me`, que o frontend chama a cada carregamento de página (desde que a sessão passou a ser por cookie). Bastavam 20 recargas em 15 minutos para a API responder 429 ("Muitas tentativas"), a tela cair no login e o próprio login também ser bloqueado. Apareceu durante a conferência visual, que fez vários logins seguidos, mas atingiria qualquer usuário.
2. **Correção:** o limite passou para `POST /auth/login` e `POST /auth/register` (que dividem a mesma cota); `/me` e `/logout` ficaram fora. `criarAuthLimiter` e `criarAuthRoutes` recebem o limite como parâmetro para o teste poder exercitá-lo de verdade, já que o limite padrão fica desligado em `NODE_ENV=test`. Escrito antes com TDD (`tests/ratelimit.test.ts`: 429 depois do limite, cadastro dividindo a cota, `/me` e `/logout` sem contar). Backend: 89 testes (eram 84).

## Refatoração (etapa azul do TDD) — concluída

Mudanças sem alterar comportamento, com a suíte de testes como rede de segurança (backend: 73 testes; frontend: de 80 para 96).

- **Frontend:**
  - `ListaTarefas` substitui o bloco de edição/listagem de tarefas que estava duplicado em `DashboardPage` e `GrupoItem`.
  - `lib/arrasto.ts`: a decisão de mover ao soltar virou a função pura `decidirMovimento` (antes sem nenhum teste), e as strings mágicas (`'tarefa'`, `'grupo'`, `'raiz'`, `grupo:${id}`) viraram tipos e constantes.
  - `useSair` tirou o logout da página; `useExclusaoComDesfazer` e `consultas.ts` tiraram a exclusão com desfazer e as chaves de consulta de dentro do `useArvore`.
  - A camada de API foi para `src/services/`.
  - Duração dos avisos padronizada por tipo no `useToast`; o padrão "avisar sucesso e atualizar" deixou de ser repetido.
  - Código morto removido: `listarGrupos`, o ícone `plus` e o `export` desnecessário de `casa`.
- **Backend:** o `$graphLookup` repetido em `depthOf` e `subtreeOf` passou a usar um único `percorrer`, e o helper `auth` dos testes, que estava copiado em 4 arquivos, foi para `tests/helpers.ts`.

## Pendências do roadmap — concluídas

1. **Paginação** em `GET /tarefas` e `GET /grupos`:
   - Parâmetros `?pagina=` e `?limite=` (padrão 20, máximo 100), validados com Zod.
   - O corpo continua sendo array. O total vai nos cabeçalhos `X-Total-Count`, `X-Page` e `X-Limit`, expostos no CORS.
   - Ordenação estável, com `_id` como desempate.
2. **Swagger** atualizado com os parâmetros e cabeçalhos de paginação, os 400 de query e o 409 de conflito. O 429 de `/auth` já estava documentado.
3. **Movimentos concorrentes de grupos**:
   - `placementIsValid` revalida ciclo e profundidade depois de gravar.
   - Em conflito, desfaz o movimento (ou a criação) e responde 409.
   - Testes de paginação e de movimentos simultâneos em `tests/hardening.test.ts`.

Lint, typecheck e os 58 testes do backend passam; o frontend tem 34 testes passando.

## Autenticação por cookie — concluída

1. Testes escritos primeiro (`tests/cookies.test.ts` no backend; `api.test.ts` e `App.test.tsx` no frontend).
2. Backend: `cookie-parser`, cookie no login, `GET /auth/me`, `POST /auth/logout`, CORS com credenciais e variável `FRONTEND_URL`.
3. Frontend: `credentials: 'include'`, `useSessao` no lugar do token no `localStorage`, logout no servidor.
4. O login ainda devolve `{ token }` no corpo, para o Swagger e clientes de API.

## CI na raiz do repositório e para os dois projetos — concluído

1. **Defeito:** o workflow estava em `trabalho_1_crud_backend/.github/`, e o GitHub só executa workflows em `.github/workflows/` na **raiz do repositório**; como o repositório tem a raiz acima das duas pastas, o CI nunca rodaria. Além disso, só cobria o backend.
2. **Correção:** o arquivo foi movido para `.github/workflows/ci.yml` na raiz, com dois jobs em paralelo (`defaults.run.working-directory` e `cache-dependency-path` apontando para cada pasta): backend (`npm ci`, `lint`, `typecheck`, `test`) e frontend (`npm ci`, `lint`, `build`, `test`). `check-latest: true` garante uma Node 22 recente, porque o React Router 8 e o Vitest 5 exigem Node 22.22+.
3. **Verificação:** não dá para executar o GitHub Actions localmente, então os mesmos passos foram reproduzidos numa cópia limpa (sem `node_modules`, `dist` nem `.env`), com Node 24 e com Node 22.23: os 8 passos passaram, com 89 testes no backend e 166 no frontend. O que ainda só se confirma no GitHub é a primeira execução real.
