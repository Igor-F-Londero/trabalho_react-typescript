/**
 * Sobe a API de verdade (a mesma de `trabalho_1_crud_backend`) em cima de um MongoDB em memória, para os
 * testes de ponta a ponta. Cada execução começa com o banco vazio e não precisa de Docker nem de MongoDB instalado.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

// Distros que o MongoDB não suporta (ex.: Fedora) usam o binário do Ubuntu, como nos testes do backend.
if (process.platform === 'linux') process.env.MONGOMS_DISTRO ??= 'ubuntu-22.04';

const mongod = await MongoMemoryServer.create();

// `NODE_ENV=test` desliga o limite de tentativas de login/cadastro: cada teste cria a própria conta e
// o limite (que tem testes próprios no backend) só atrapalharia. Todo o resto é igual ao uso normal.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = mongod.getUri('tarefas_e2e');
process.env.JWT_SECRET = 'segredo-so-para-os-testes-e2e';
process.env.PORT ??= '3100';
process.env.FRONTEND_URL ??= 'http://localhost:5174';

// O caminho não é literal de propósito: o TypeScript não tenta checar o código do backend com a config daqui.
const entrada = '../../trabalho_1_crud_backend/src/server.ts';
await import(entrada);

// O `server.ts` do backend já fecha o servidor e a conexão; aqui só falta parar o MongoDB em memória.
async function encerrar() {
  await mongod.stop();
  process.exit(0);
}
process.once('SIGTERM', encerrar);
process.once('SIGINT', encerrar);
