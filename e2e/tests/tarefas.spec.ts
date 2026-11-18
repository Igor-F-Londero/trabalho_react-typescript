import type { Page } from '@playwright/test';
import { FUSO, IDIOMA, URL_API } from './constantes';
import { Api, expect, novaConta, test } from './fixtures';

/** O formulário aberto de tarefa (a tela também tem filtros com "Prioridade" etc., então os campos são buscados só aqui). */
const formularioDeTarefa = (page: Page) =>
  page.locator('form', { has: page.getByRole('button', { name: 'Salvar tarefa' }) });

/** A linha de uma tarefa: o `<li>` que tem diretamente o checkbox dela (os `<li>` dos grupos que a contêm não contam). */
const linhaDaTarefa = (page: Page, titulo: string) => page.locator(`li:has(> input[aria-label="Concluir ${titulo}"])`);

test.describe('Tarefas e grupos', () => {
  test('cria grupo, subgrupo e tarefa, e tudo continua lá depois de recarregar', async ({ page, sessao }) => {
    // Data futura e fixa: com um prazo que já passou, a etiqueta diria "Atrasada" em vez de "Prazo".
    const prazo = '2099-12-15';

    await page.goto('/');
    await expect(page.getByText('Você ainda não tem grupos')).toBeVisible();

    await page.getByRole('button', { name: 'Criar primeiro grupo' }).click();
    await page.getByLabel('Nome do grupo (ex.: Faculdade)').fill('Faculdade');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.getByText('Faculdade', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Novo subgrupo em Faculdade' }).click();
    await page.getByLabel('Nome do subgrupo').fill('Programação Web');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.getByText('Programação Web', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Nova tarefa em Programação Web' }).click();
    const form = formularioDeTarefa(page);
    await form.getByLabel('Título').fill('Estudar React Router');
    await form.getByLabel('Descrição').fill('Rotas protegidas e rotas aninhadas');
    await form.getByLabel('Prioridade').selectOption('alta');
    await form.getByLabel('Prazo').fill(prazo);
    await page.getByRole('button', { name: 'Salvar tarefa' }).click();

    const linha = linhaDaTarefa(page, 'Estudar React Router');
    await expect(linha).toContainText('Alta');
    await expect(linha).toContainText('Prazo 15/12/2099');
    await expect(linha).toContainText('Rotas protegidas e rotas aninhadas');

    // Foi para o MongoDB: a árvore devolvida pela API tem a tarefa dentro do subgrupo.
    const arvore = await sessao.api.arvore();
    expect(arvore.grupos).toHaveLength(1);
    expect(arvore.grupos[0].nome).toBe('Faculdade');
    expect(arvore.grupos[0].subgrupos[0].nome).toBe('Programação Web');
    expect(arvore.grupos[0].subgrupos[0].tarefas[0]).toMatchObject({ titulo: 'Estudar React Router', prioridade: 'alta' });

    await page.reload();
    await expect(page.getByText('Programação Web', { exact: true })).toBeVisible();
    await expect(linhaDaTarefa(page, 'Estudar React Router')).toBeVisible();
  });

  test('conclui e edita uma tarefa, e o servidor guarda as mudanças', async ({ page, sessao }) => {
    const tarefa = await sessao.api.criarTarefa({ titulo: 'Ler o capítulo 3', prioridade: 'baixa' });
    await page.goto('/');

    const concluir = page.getByRole('checkbox', { name: 'Concluir Ler o capítulo 3' });
    await concluir.check();
    await expect(concluir).toBeChecked();
    await expect.poll(async () => (await sessao.api.tarefa(tarefa._id))?.status).toBe('concluida');

    await page.getByRole('button', { name: 'Editar Ler o capítulo 3' }).click();
    const form = formularioDeTarefa(page);
    await form.getByLabel('Título').fill('Ler os capítulos 3 e 4');
    await form.getByLabel('Prioridade').selectOption('alta');
    await page.getByRole('button', { name: 'Salvar tarefa' }).click();

    await expect(page.getByText('Ler os capítulos 3 e 4')).toBeVisible();
    await expect
      .poll(async () => await sessao.api.tarefa(tarefa._id))
      .toMatchObject({ titulo: 'Ler os capítulos 3 e 4', prioridade: 'alta', status: 'concluida' });
  });

  test('excluir some na hora, dá para desfazer e, passado o prazo, apaga no servidor', async ({ page, sessao }) => {
    const tarefa = await sessao.api.criarTarefa({ titulo: 'Tarefa descartável' });
    await page.goto('/');

    const excluir = async () => {
      await page.getByRole('button', { name: 'Excluir Tarefa descartável' }).click();
      await page.getByRole('button', { name: 'Confirmar: Excluir Tarefa descartável' }).click();
    };
    const texto = page.getByText('Tarefa descartável', { exact: true });

    // Excluir e desfazer: a tarefa volta e a API nunca chegou a apagá-la.
    await excluir();
    await expect(texto).toBeHidden();
    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(texto).toBeVisible();
    expect(await sessao.api.tarefa(tarefa._id)).not.toBeNull();

    // Excluir e deixar passar o tempo do "Desfazer": só então a API recebe o DELETE.
    const apagou = page.waitForResponse((r) => r.request().method() === 'DELETE' && r.url().endsWith(`/tarefas/${tarefa._id}`), { timeout: 15_000 });
    await excluir();
    expect((await apagou).status()).toBe(204);
    expect(await sessao.api.tarefa(tarefa._id)).toBeNull();
    await page.reload();
    await expect(page.getByText('Você ainda não tem grupos')).toBeVisible();
  });

  test('excluir um grupo com conteúdo pede confirmação extra e leva o conteúdo junto', async ({ page, sessao }) => {
    const grupo = await sessao.api.criarGrupo('Projeto final');
    const tarefa = await sessao.api.criarTarefa({ titulo: 'Escrever o relatório', grupo: grupo._id });
    await page.goto('/');

    await page.getByRole('button', { name: 'Excluir Projeto final' }).click();
    await page.getByRole('button', { name: 'Confirmar: Excluir Projeto final' }).click();
    await expect(page.getByText('Tem conteúdo. Excluir tudo?')).toBeVisible();
    // Nada foi apagado ainda: o app só avisou.
    expect(await sessao.api.grupo(grupo._id)).not.toBeNull();

    const apagou = page.waitForResponse((r) => r.request().method() === 'DELETE' && r.url().includes(`/grupos/${grupo._id}`), { timeout: 15_000 });
    await page.getByRole('button', { name: 'Excluir Projeto final e todo o conteúdo' }).click();
    await expect(page.getByText('Projeto final', { exact: true })).toBeHidden();
    expect((await apagou).status()).toBe(204);

    expect(await sessao.api.grupo(grupo._id)).toBeNull();
    expect(await sessao.api.tarefa(tarefa._id)).toBeNull();
  });

  test('arrastar uma tarefa para dentro de um grupo move a tarefa no servidor', async ({ page, sessao }) => {
    const grupo = await sessao.api.criarGrupo('Estudos');
    const tarefa = await sessao.api.criarTarefa({ titulo: 'Revisar as anotações' });
    await page.goto('/');

    const alca = page.getByRole('button', { name: 'Arrastar tarefa Revisar as anotações' });
    const destino = page.getByText('Estudos', { exact: true });
    const [origem, alvo] = [await alca.boundingBox(), await destino.boundingBox()];
    expect(origem && alvo).toBeTruthy();

    // Mouse de verdade, em passos: o dnd-kit só começa a arrastar depois de alguns pixels de movimento.
    await page.mouse.move(origem!.x + origem!.width / 2, origem!.y + origem!.height / 2);
    await page.mouse.down();
    await page.mouse.move(origem!.x + 20, origem!.y + 20, { steps: 5 });
    await page.mouse.move(alvo!.x + alvo!.width / 2, alvo!.y + alvo!.height / 2, { steps: 15 });
    await page.mouse.up();

    await expect.poll(async () => (await sessao.api.tarefa(tarefa._id))?.grupo).toBe(grupo._id);
    // Na tela, a tarefa passou a aparecer dentro do grupo.
    const itemDoGrupo = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Arrastar grupo Estudos' }) });
    await expect(itemDoGrupo.getByText('Revisar as anotações')).toBeVisible();
    await expect(itemDoGrupo).toContainText('0/1');
  });

  test('uma conta não enxerga nem altera os dados de outra', async ({ browser, baseURL, sessao }) => {
    const segredo = await sessao.api.criarTarefa({ titulo: 'Segredo da primeira conta' });

    const contexto = await browser.newContext({ baseURL, locale: IDIOMA, timezoneId: FUSO });
    try {
      await new Api(contexto.request).cadastrarELogar(novaConta());
      const outraPagina = await contexto.newPage();
      await outraPagina.goto('/');

      await expect(outraPagina.getByText('Você ainda não tem grupos')).toBeVisible();
      await expect(outraPagina.getByText('Segredo da primeira conta')).toHaveCount(0);

      const alvo = `${URL_API}/tarefas/${segredo._id}`;
      expect((await contexto.request.get(alvo)).status()).toBe(404);
      expect((await contexto.request.put(alvo, { data: { titulo: 'Invadida!' } })).status()).toBe(404);
      expect((await contexto.request.delete(alvo)).status()).toBe(404);
    } finally {
      await contexto.close();
    }
    expect(await sessao.api.tarefa(segredo._id)).toMatchObject({ titulo: 'Segredo da primeira conta' });
  });
});
