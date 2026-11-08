import mongoose from 'mongoose';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

// Ponto de entrada: só sobe o servidor depois que o MongoDB estiver conectado.
await connectDatabase();
const server = app.listen(env.port, () => {
  console.log(`Servidor em http://localhost:${env.port}`);
  console.log(`Swagger em http://localhost:${env.port}/docs`);
});

// Encerramento limpo (docker stop / Ctrl+C): para de aceitar conexões e fecha o banco.
function shutdown() {
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
