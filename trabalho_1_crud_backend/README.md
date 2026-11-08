# API de Tarefas

> Guia completo para instalar e usar o sistema inteiro (API + interface), com capturas de tela: [README da raiz](../README.md).

Backend em Node.js + Express + TypeScript para gerenciamento de tarefas. O recurso principal do CRUD é **Tarefa**; cada usuário se cadastra, faz login (JWT em cookie HttpOnly) e acessa apenas as próprias tarefas.

As tarefas podem ser organizadas em **grupos aninhados** (ex.: `Faculdade` > `Matéria 1` > tarefas), com até 10 níveis de profundidade.

**Campos da tarefa:** `titulo` (obrigatório, 3–120), `descricao`, `status` (`pendente` | `em_andamento` | `concluida`), `prioridade` (`baixa` | `media` | `alta`), `prazo` (data), `grupo` (ID do grupo, opcional).

**Campos do grupo:** `nome` (obrigatório, 2–80), `pai` (ID do grupo pai; `null` = grupo raiz).

## Tecnologias

Node.js, Express 5, TypeScript, MongoDB + Mongoose, Zod (validação), JWT + bcryptjs (login), Helmet + express-rate-limit (segurança), Swagger UI (OpenAPI 3), Vitest + Supertest (testes), Docker Compose (MongoDB).

## Como executar

Pré-requisitos: Node 22.22+ (as ferramentas de teste e a interface exigem Node 22 ou mais novo) e Docker.

```bash
npm install
cp .env.example .env        # ajuste JWT_SECRET
docker compose up -d        # (VS Code Flatpak: prefixe com `flatpak-spawn --host`) sobe o MongoDB (volume mongo_data persiste os dados)
npm run seed                # opcional: usuário demo@email.com / demo123 com grupos e tarefas em cerca de 9 meses
npm run dev                 # http://localhost:3000
```

Para parar o banco: `docker compose down` (os dados continuam no volume; `docker compose down -v` apaga tudo).

Build de produção: `npm run build && npm start`.

## Variáveis de ambiente

| Variável         | Descrição                                                                  | Exemplo                             |
| ---------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| `PORT`           | Porta da API                                                               | `3000`                              |
| `MONGO_URI`      | String de conexão do MongoDB                                               | `mongodb://localhost:27017/tarefas` |
| `JWT_SECRET`     | Segredo para assinar os tokens (**obrigatório** com `NODE_ENV=production`) | `troque-por-um-segredo-forte`       |
| `NODE_ENV`       | `production` exige `JWT_SECRET`                                            | `development`                       |
| `JWT_EXPIRES_IN` | Validade do token (e do cookie)                                            | `1d`                                |
| `FRONTEND_URL`   | Única origem liberada no CORS (necessário para enviar cookies)             | `http://localhost:5173`             |

## Swagger

Com a API rodando: **http://localhost:3000/docs**. Cadastre-se em `/auth/register`, faça login em `/auth/login`, copie o `token` da resposta, clique em **Authorize** e cole-o para testar `/tarefas`.

## Autenticação

O token é aceito de duas formas: no cookie `token` (usado pelo frontend, que o navegador envia sozinho e o JavaScript não consegue ler) ou no header `Authorization: Bearer <jwt>` (Swagger e clientes de API). O cookie é `HttpOnly`, `SameSite=Lax` e `Secure` quando `NODE_ENV=production`; em produção, com front e API em domínios diferentes, `SameSite=Lax` não basta e seria preciso servir ambos sob o mesmo site.

**Limite de tentativas:** `POST /auth/login` e `POST /auth/register` aceitam 20 tentativas a cada 15 minutos por IP (as duas dividem a mesma cota); depois disso respondem `429`. `GET /auth/me` e `POST /auth/logout` não contam, porque o frontend chama `/auth/me` a cada carregamento de página. O limite fica desligado em `NODE_ENV=test`.

## Endpoints

| Método | Rota                     | Descrição                                                                   | Auth |
| ------ | ------------------------ | --------------------------------------------------------------------------- | ---- |
| POST   | `/auth/register`         | Cadastra usuário                                                            | não  |
| POST   | `/auth/login`            | Grava o JWT em cookie `token` (HttpOnly, SameSite=Lax) e o devolve no corpo | não  |
| GET    | `/auth/me`               | Dados do usuário logado                                                     | sim  |
| POST   | `/auth/logout`           | Apaga o cookie de sessão                                                    | não  |
| POST   | `/tarefas`               | Cria tarefa                                                                 | sim  |
| GET    | `/tarefas`               | Lista paginada (filtros `status`, `prioridade`, `grupo` — ID ou `nenhum`)   | sim  |
| GET    | `/tarefas/resumo-mensal` | Resumo mensal de conclusão com média ponderada (filtro `ano`)               | sim  |
| GET    | `/tarefas/:id`           | Consulta por ID                                                             | sim  |
| PUT    | `/tarefas/:id`           | Atualiza (parcial)                                                          | sim  |
| DELETE | `/tarefas/:id`           | Exclui                                                                      | sim  |

## Qualidade de código

```bash
npm run lint        # ESLint (typescript-eslint)
npm run format      # Prettier
npm run typecheck   # tsc --noEmit
```

## Testes

```bash
npm test
```

Os testes (89, em `tests/`) usam um MongoDB em memória (`mongodb-memory-server`, baixa o binário na primeira execução), então não dependem do Docker nem sujam o banco de desenvolvimento. Cobrem sucesso e erro do CRUD (validação, 404, ID inválido, isolamento entre usuários), do login (credenciais inválidas, dados ausentes), da sessão por cookie (`HttpOnly`, `/auth/me`, `/auth/logout`, CORS com credenciais), do limite de tentativas (`ratelimit.test.ts`), do resumo mensal (`summary.test.ts`) e dos dados do seed (`seed-dados.test.ts`).

## Estrutura

```
src/
  config/       env, conexão com o banco, especificação Swagger
  models/       schemas Mongoose (User, Group, Task)
  schemas/      validação Zod
  controllers/  camada HTTP: recebe a request e devolve a response
  services/     regras de negócio (CRUD, ownership, árvore de grupos, ciclos, auth)
  routes/       definição das rotas
  middlewares/  auth JWT (cookie ou Bearer), validação, rate limit, tratamento de erros
  utils/        AppError e paginação
  seed.ts       script do `npm run seed` (grava no banco)
  seed-dados.ts árvore de exemplo e histórico de meses do seed (sem banco, testável)
tests/          testes automatizados
```

## Docker e health check

`docker compose up -d` sobe só o MongoDB. Para rodar a API também em container: `docker compose --profile app up -d --build` (exige `JWT_SECRET` no `.env`). `GET /health` devolve 200 com o banco conectado e 503 caso contrário (usado pelo `HEALTHCHECK` do Dockerfile). O CI fica na **raiz do repositório** (`../.github/workflows/ci.yml`) e roda lint, typecheck e testes do backend (e lint, build e testes do frontend).

## Resumo mensal

`GET /tarefas/resumo-mensal` (opcional: `?ano=2026`) agrupa as tarefas pelo **mês do prazo** e informa, por mês e no geral: `total`, `concluidas`, `taxa` (concluídas ÷ total) e `taxaPonderada`.

A **média ponderada** conta cada tarefa com o peso da prioridade (alta 3, média 2, baixa 1, definidos em `PESOS` no `summary.service.ts`): `Σ(peso × concluídas) ÷ Σ(peso × total)`. Assim, concluir uma tarefa alta pesa mais que concluir uma baixa. Exemplo: em um mês com 1 alta concluída e 2 baixas pendentes, a taxa simples é 33,3% e a ponderada é 60% (3 ÷ 5).

`geral` é calculado sobre todas as tarefas do período (não é a média das taxas mensais) e traz também `mediaTarefasPorMes`, `mediaConcluidasPorMes` e `semPrazo`. Tarefas **sem prazo ficam fora** do resumo e só aparecem contadas em `semPrazo`. O mês usa o prazo em UTC, como ele é gravado.

## Paginação

`GET /tarefas` e `GET /grupos` aceitam `?pagina=` (padrão 1) e `?limite=` (padrão 20, máximo 100); valores inválidos retornam 400. O corpo continua sendo um array; o total vem nos cabeçalhos `X-Total-Count`, `X-Page` e `X-Limit`.

## Grupos

| Método | Rota             | Descrição                                                                                |
| ------ | ---------------- | ---------------------------------------------------------------------------------------- |
| POST   | `/grupos`        | Cria grupo raiz ou subgrupo (informe `pai`)                                              |
| GET    | `/grupos`        | Lista plana (filtro `pai`: ID ou `raiz`)                                                 |
| GET    | `/grupos/arvore` | Árvore completa: grupos > subgrupos > tarefas                                            |
| GET    | `/grupos/:id`    | Grupo com filhos diretos e tarefas                                                       |
| PUT    | `/grupos/:id`    | Renomeia ou move (`pai`); ciclos são recusados (400)                                     |
| DELETE | `/grupos/:id`    | Exclui; se não vazio retorna 409, ou use `?cascata=true` para apagar subgrupos e tarefas |

Movimentos simultâneos que gerariam ciclo ou estourariam o limite são desfeitos e retornam 409.

A hierarquia aceita no máximo **10 níveis** (raiz = 1); criar ou mover além disso retorna 400.

Exemplo: crie `Faculdade` (sem `pai`), depois `Matéria 1` e `Matéria 2` com `pai` = ID de Faculdade, e crie tarefas com `grupo` = ID da matéria. `GET /grupos/arvore` devolve tudo aninhado.
