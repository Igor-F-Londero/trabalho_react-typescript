import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV ?? 'development';

// Falha cedo: em produção, nunca assinar tokens com o segredo padrão de desenvolvimento.
if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET é obrigatório em produção');
}

/** Variáveis de ambiente tipadas, com valores padrão para desenvolvimento. */
export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/tarefas',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  // Origem do frontend liberada no CORS (com cookies não dá para usar '*').
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
};
