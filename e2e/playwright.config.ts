import { defineConfig } from '@playwright/test';
import { FUSO, IDIOMA, URL_API, URL_WEB } from './tests/constantes';

export default defineConfig({
  testDir: './tests',
  // Cada teste cria o próprio usuário, então não há dados em comum e eles podem rodar ao mesmo tempo.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: URL_WEB,
    // Datas e números saem como o usuário brasileiro vê, em qualquer máquina.
    locale: IDIOMA,
    timezoneId: FUSO,
    // Sem animações os testes não esperam por transições (o app já respeita essa preferência).
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Firefox: é o navegador em que o app foi verificado à mão. Um projeto por navegador cabe aqui se precisar de mais.
  projects: [{ name: 'firefox', use: { browserName: 'firefox' } }],

  webServer: [
    {
      // API real + MongoDB em memória (ver servidor/api.ts).
      command: 'npm run api',
      env: { PORT: '3100', FRONTEND_URL: URL_WEB },
      url: `${URL_API}/health`,
      timeout: 120_000, // a primeira vez baixa o binário do MongoDB
      reuseExistingServer: !!process.env.E2E_REUSAR,
    },
    {
      // O frontend é compilado de verdade (como em produção) apontando para a API de teste.
      command:
        'cd ../trabalho_2_frontend && npx vite build --outDir ../e2e/.web --emptyOutDir && ' +
        'npx vite preview --outDir ../e2e/.web --port 5174 --strictPort',
      env: { VITE_API_URL: URL_API },
      url: URL_WEB,
      timeout: 180_000,
      reuseExistingServer: !!process.env.E2E_REUSAR,
    },
  ],
});
