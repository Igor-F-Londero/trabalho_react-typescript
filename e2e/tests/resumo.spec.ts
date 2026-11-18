import { FUSO, IDIOMA } from './constantes';
import { Api, expect, nomeDoMes, novaConta, prazoNoMesAtual, test } from './fixtures';

test.describe('Página /resumo', () => {
  test('mostra os números e os gráficos calculados pela API, a partir das tarefas do mês', async ({ page, sessao }) => {
    const prazo = prazoNoMesAtual(15);
    // Alta concluída (peso 3), média e baixa pendentes (pesos 2 e 1): 1 de 3 tarefas (33,3%), mas 3 de 6 pontos (50%).
    await sessao.api.criarTarefa({ titulo: 'Entregar o trabalho', prioridade: 'alta', status: 'concluida', prazo });
    await sessao.api.criarTarefa({ titulo: 'Revisar o texto', prioridade: 'media', prazo });
    await sessao.api.criarTarefa({ titulo: 'Organizar a pasta', prioridade: 'baixa', prazo });
    await sessao.api.criarTarefa({ titulo: 'Ideia solta, sem prazo' });

    // Chega pela navegação do app (troca de rota sem recarregar), não digitando o endereço.
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Resumo' }).click();

    await expect(page).toHaveURL('/resumo');
    await expect(page.getByRole('link', { name: 'Resumo' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'Resumo mensal' })).toBeVisible();

    const numeros = page.getByRole('group', { name: 'Resumo em números' });
    await expect(numeros).toContainText('1/3');
    await expect(numeros).toContainText('tarefas concluídas');
    await expect(numeros.getByText('tarefas por mês')).toBeVisible();

    // Os gráficos são desenhos (o leitor de tela ganha uma descrição completa no lugar).
    await expect(page.getByRole('img', { name: /Avanço geral de 50% .* 33,3% das tarefas com prazo foram concluídas/ })).toBeVisible();
    const conclusao = page.getByRole('img', { name: new RegExp(`Conclusão por mês\\. ${nomeDoMes(prazo)}: 33,3% feito e 50% por importância`) });
    await expect(conclusao).toBeVisible();
    await expect(page.getByRole('img', { name: /Tarefas por prioridade\. Alta: 1 de 1 concluídas\. Média: 0 de 1 concluídas\. Baixa: 0 de 1 concluídas\./ })).toBeVisible();
    await expect(page.locator('svg.recharts-surface')).toHaveCount(4);
    await expect(conclusao.locator('.recharts-bar-rectangle').first()).toBeVisible();

    await expect(page.getByText('1 tarefa sem prazo não entra no resumo.')).toBeVisible();

    await page.getByRole('button', { name: 'Como é calculado' }).click();
    await expect(page.getByText(/cada tarefa alta vale 3, média 2 e baixa 1/)).toBeVisible();

    await page.getByRole('button', { name: 'Tabela detalhada' }).click();
    const linha = page.getByRole('row').filter({ hasText: nomeDoMes(prazo) });
    await expect(linha).toContainText('mês atual');
    await expect(linha.getByRole('cell')).toHaveText(['3', '1', '33,3%', '50%']);
  });

  test('o resumo acompanha o que é feito na tela de tarefas', async ({ page, sessao }) => {
    const prazo = prazoNoMesAtual(10);
    await sessao.api.criarTarefa({ titulo: 'Preparar a apresentação', prioridade: 'alta', prazo });
    await sessao.api.criarTarefa({ titulo: 'Gravar o vídeo', prioridade: 'baixa', prazo });

    await page.goto('/resumo');
    await expect(page.getByRole('group', { name: 'Resumo em números' })).toContainText('0/2');

    // Concluir a tarefa de maior peso na tela de tarefas muda os números na volta ao resumo.
    await page.getByRole('link', { name: 'Tarefas' }).click();
    await page.getByRole('checkbox', { name: 'Concluir Preparar a apresentação' }).check();
    await expect.poll(async () => (await sessao.api.tarefas()).filter((t) => t.status === 'concluida').length).toBe(1);

    await page.getByRole('link', { name: 'Resumo' }).click();
    await expect(page.getByRole('group', { name: 'Resumo em números' })).toContainText('1/2');
    // 3 de 4 pontos: a tarefa alta vale mais do que a baixa.
    await expect(page.getByRole('img', { name: /Avanço geral de 75%/ })).toBeVisible();
  });

  test('sem tarefas com prazo explica o que fazer', async ({ page, sessao }) => {
    await sessao.api.criarTarefa({ titulo: 'Só uma anotação' });

    await page.goto('/resumo');
    await expect(page.getByText('Nenhuma tarefa com prazo ainda.')).toBeVisible();
    await expect(page.getByText('1 tarefa sem prazo não entra no resumo.')).toBeVisible();
    await expect(page.locator('svg.recharts-surface')).toHaveCount(0);
  });

  test('cada conta vê só o próprio resumo', async ({ browser, baseURL, sessao }) => {
    await sessao.api.criarTarefa({ titulo: 'Da primeira conta', prioridade: 'alta', status: 'concluida', prazo: prazoNoMesAtual(5) });

    const contexto = await browser.newContext({ baseURL, locale: IDIOMA, timezoneId: FUSO });
    try {
      await new Api(contexto.request).cadastrarELogar(novaConta());
      const pagina = await contexto.newPage();
      await pagina.goto('/resumo');
      await expect(pagina.getByText('Nenhuma tarefa com prazo ainda.')).toBeVisible();
    } finally {
      await contexto.close();
    }
  });
});
