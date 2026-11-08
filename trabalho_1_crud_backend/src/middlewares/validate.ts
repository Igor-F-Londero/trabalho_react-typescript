import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

/** Valida com Zod; em caso de falha lança 400 com a lista de campos inválidos. */
function parse(schema: ZodType, data: unknown) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const details = result.error.issues.map((i) => ({
    campo: i.path.join('.'),
    mensagem: i.message,
  }));
  throw new AppError(400, 'Dados inválidos', details);
}

/** Valida `req.body` e o substitui pelo resultado já tratado (trim, coerção de datas etc.). */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    try {
      req.body = parse(schema, req.body);
      next();
    } catch (err) {
      next(err);
    }
  };

/** No Express 5 `req.query` é somente leitura; o resultado fica em `res.locals.query`. */
export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    try {
      res.locals.query = parse(schema, req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
