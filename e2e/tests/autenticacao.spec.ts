import { COOKIE_SESSAO, URL_API } from './constantes';
import { Api, expect, test } from './fixtures';

test.describe('Login e sessão por cookie', () => {
  test('quem não está logado é levado ao login ao abrir uma página protegida', async ({ page }) => {
    for (const rota of ['/', '/resumo']) {
      await page.goto(rota);
      await expect(page).toHaveURL('/login');
      await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    }
  });

  test('cria a conta pelo formulário e entra direto no painel, com um cookie HttpOnly', async ({ page, context, conta }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();

    await page.getByLabel('Nome', { exact: true }).fill(conta.nome);
    await page.getByLabel('E-mail').fill(conta.email);
    await page.getByLabel('Senha').fill(conta.senha);
    await page.getByRole('button', { name: 'Cadastrar e entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Minhas tarefas' })).toBeVisible();
    await expect(page.getByText(`Olá, ${conta.nome}`)).toBeVisible();

    // O token fica num cookie que o JavaScript da página não consegue ler.
    const cookie = (await context.cookies(URL_API)).find((c) => c.name === COOKIE_SESSAO);
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
    expect(await page.evaluate(() => document.cookie)).toBe('');
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain(cookie!.value);
  });

  test('a sessão sobrevive a recarregar a página e termina ao sair', async ({ page, context, sessao }) => {
    const painel = page.getByRole('heading', { name: 'Minhas tarefas' });
    await page.goto('/');
    await expect(painel).toBeVisible();
    await page.reload();
    await expect(painel).toBeVisible();
    await expect(page.getByText(`Olá, ${sessao.conta.nome}`)).toBeVisible();

    await page.getByRole('button', { name: 'Sair da conta' }).click();
    await expect(page).toHaveURL('/login');
    expect((await context.cookies(URL_API)).find((c) => c.name === COOKIE_SESSAO)).toBeUndefined();

    // Sem o cookie, as páginas protegidas e a própria API recusam.
    await page.goto('/resumo');
    await expect(page).toHaveURL('/login');
    expect((await context.request.get(`${URL_API}/auth/me`)).status()).toBe(401);
  });

  test('mostra a mensagem da API quando a senha está errada e deixa entrar com a certa', async ({ page, playwright, conta }) => {
    // A conta é criada num "navegador" à parte, para esta página continuar deslogada.
    const outro = await playwright.request.newContext();
    await new Api(outro).cadastrar(conta);
    await outro.dispose();

    await page.goto('/login');
    await page.getByLabel('E-mail').fill(conta.email);
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page.getByRole('alert')).toHaveText('Credenciais inválidas');
    await expect(page).toHaveURL('/login');

    await page.getByLabel('Senha').fill(conta.senha);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByText(`Olá, ${conta.nome}`)).toBeVisible();
  });

  test('não deixa cadastrar um e-mail que já existe', async ({ page, playwright, conta }) => {
    const outro = await playwright.request.newContext();
    await new Api(outro).cadastrar(conta);
    await outro.dispose();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome', { exact: true }).fill('Outra pessoa');
    await page.getByLabel('E-mail').fill(conta.email);
    await page.getByLabel('Senha').fill('outra-senha-123');
    await page.getByRole('button', { name: 'Cadastrar e entrar' }).click();

    await expect(page.getByRole('alert')).toHaveText('E-mail já cadastrado');
    await expect(page).toHaveURL('/login');
  });
});
