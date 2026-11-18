# Testes de ponta a ponta

Cenários que usam o sistema inteiro, como uma pessoa usaria: um **Firefox de verdade** (controlado pelo [Playwright](https://playwright.dev)) abre o **frontend compilado**, que conversa com a **API real**, que grava num **MongoDB em memória**. Nada é simulado.

Os outros testes do projeto cobrem cada parte separada (o backend contra o banco, o frontend contra uma API de mentira). Estes cobrem o que só aparece quando as partes estão juntas: o cookie `HttpOnly` indo e voltando entre navegador e servidor, as rotas protegidas, o arrastar e soltar com o mouse, e os números do `/resumo` saindo da API e chegando aos gráficos.

## Como rodar

Pré-requisitos: Node 22+ e as dependências das três pastas.

```bash
# na raiz do repositório
(cd trabalho_1_crud_backend && npm install)
(cd trabalho_2_frontend && npm install)
cd e2e
npm install
npx playwright install firefox     # baixa o navegador, só na primeira vez
npm test
```

Não precisa de Docker nem de MongoDB instalado. Na primeira vez, o `mongodb-memory-server` baixa o binário do MongoDB (alguns minutos, uma vez só).

Ao rodar `npm test`, o Playwright:

1. sobe a API na porta **3100** (`servidor/api.ts`: um MongoDB em memória + o `server.ts` do backend);
2. compila o frontend apontando para essa API e o serve na porta **5174**;
3. roda os cenários e, ao final, derruba tudo.

As portas são diferentes das de desenvolvimento (3000 e 5173), então dá para rodar os testes com o app aberto.

| Comando                           | O que faz                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm test`                        | Roda todos os cenários sem janela (modo do CI)                   |
| `npm run test:ui`                 | Abre a interface do Playwright: dá para ver cada passo e repetir |
| `npx playwright test --headed`    | Mostra o Firefox abrindo e clicando                              |
| `npx playwright test -g "resumo"` | Roda só os cenários cujo nome contém "resumo"                    |
| `npm run relatorio`               | Abre o relatório HTML da última execução (gerado com `CI=1`)     |
| `npm run typecheck`               | Confere os tipos dos testes                                      |

Se algo já estiver respondendo nas portas 3100 ou 5174, o teste para com um erro, para nunca testar uma versão velha por engano. `E2E_REUSAR=1 npm test` faz o Playwright aproveitar servidores que já estejam no ar (útil ao deixar `npm run api` rodando enquanto escreve testes).

Quando um teste falha, o Playwright guarda uma captura de tela e um *trace* em `test-results/` (abra com `npx playwright show-trace <pasta>/trace.zip`). No CI, essa pasta vai como artefato do job.

## O que é testado

| Arquivo                      | Cenários                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/autenticacao.spec.ts` | Páginas protegidas levam ao login; cadastro pelo formulário com cookie `HttpOnly` (que o JavaScript não lê); sessão que sobrevive ao recarregar e termina ao sair; senha errada; e-mail repetido |
| `tests/tarefas.spec.ts`      | Criar grupo, subgrupo e tarefa e conferir no banco; concluir e editar; excluir com "Desfazer" e com a exclusão de fato; excluir grupo com conteúdo; arrastar e soltar; isolamento entre contas |
| `tests/resumo.spec.ts`       | Números e gráficos do `/resumo` a partir de tarefas reais (média simples × ponderada); o resumo acompanhar o que é feito na tela de tarefas; estado vazio; isolamento entre contas             |

## Como funciona

- **Um usuário por teste.** A fixture `sessao` (em `tests/fixtures.ts`) cadastra uma conta com e-mail único e a deixa logada no navegador do teste. Como nenhum teste divide dados com outro, eles rodam em paralelo.
- **A API como atalho.** A classe `Api` prepara os dados do cenário sem passar pela tela (mais rápido) e confere, no servidor, o que a interface gravou. A interface é usada para o que o cenário quer testar.
- **Datas fixas.** O navegador roda no fuso de São Paulo e em `pt-BR`. Os cenários do resumo usam prazos no mês atual, e o da etiqueta "Prazo" usa uma data futura fixa, para o resultado não mudar com o dia em que o teste roda.
- **`NODE_ENV=test` na API.** Isso só desliga o limite de 20 tentativas de login e cadastro por IP (que tem testes próprios no backend), já que cada teste cria uma conta nova. Todo o resto é igual ao uso normal.
- **Sem animações.** O navegador pede `prefers-reduced-motion`, que o app respeita, então os testes não esperam por transições.
