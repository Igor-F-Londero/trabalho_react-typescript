import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../utils/AppError.js';

/** Cai aqui qualquer rota que nenhuma anterior atendeu. */
export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'Rota não encontrada'));
};

/** Tratador global. Os 4 parâmetros são obrigatórios para o Express reconhecê-lo como handler de erro. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.details });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido' });
  }
  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({ erro: `Valor inválido para '${err.path}'` });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ erro: 'Registro duplicado' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
};
