import { rateLimit, type Options } from 'express-rate-limit';
import { env } from '../config/env.js';

/** Quantas tentativas de login/cadastro cada IP pode fazer a cada 15 minutos. */
export const LIMITE_DE_TENTATIVAS = 20;

/**
 * Limita tentativas de senha para dificultar força bruta. Os parâmetros existem para o teste usar
 * um limite baixo e ligado (em ambiente de teste o limite padrão fica desligado).
 */
export const criarAuthLimiter = ({
  limit = LIMITE_DE_TENTATIVAS,
  skip = () => env.nodeEnv === 'test',
}: Partial<Pick<Options, 'limit' | 'skip'>> = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    message: { erro: 'Muitas tentativas. Tente novamente mais tarde.' },
  });

export const authLimiter = criarAuthLimiter();
