import type { Response } from 'express';

/** Mantém o corpo como array e informa o total/página nos cabeçalhos (expostos via CORS). */
export function setPaginationHeaders(
  res: Response,
  total: number,
  { pagina, limite }: { pagina: number; limite: number },
) {
  res.set({
    'X-Total-Count': String(total),
    'X-Page': String(pagina),
    'X-Limit': String(limite),
  });
}
