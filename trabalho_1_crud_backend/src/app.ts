import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { authRoutes } from './routes/auth.routes.js';
import { groupRoutes } from './routes/group.routes.js';
import { taskRoutes } from './routes/task.routes.js';

// A instância fica separada do `listen` (server.ts) para os testes usarem o app sem abrir porta.
export const app = express();

// Middlewares globais: cabeçalhos de segurança, CORS (só a origem do frontend, com cookies), cookies e JSON.
app.use(helmet());
app.use(
  cors({
    // Sem Origin (curl, Swagger na mesma origem, testes) passa; com Origin, só o frontend.
    origin: (origin, callback) => callback(null, !origin || origin === env.frontendUrl),
    credentials: true,
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  }),
);
app.use(cookieParser());
app.use(express.json());

// Health check para Docker/orquestradores: 503 enquanto o MongoDB não estiver conectado.
app.get('/health', (_req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'indisponivel' });
});

// Rotas. Auth é pública; grupos e tarefas exigem JWT (ver as rotas de cada recurso).
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRoutes);
app.use('/grupos', groupRoutes);
app.use('/tarefas', taskRoutes);

// Devem ser os últimos: 404 para rotas desconhecidas e tratador central de erros.
app.use(notFound);
app.use(errorHandler);
