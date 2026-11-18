import type { Prioridade } from '../../lib/types';

// Os gráficos são SVG: pintam com as mesmas variáveis de cor do Tailwind (ver index.css), então acompanham o tema claro/escuro.
export const COR = {
  primaria: 'var(--color-primaria)',
  /** A barra "% feito" fica mais clara que a "% por importância", que é a principal. */
  primariaClara: 'color-mix(in srgb, var(--color-primaria) 50%, var(--color-cartao))',
  grade: 'var(--color-borda)',
  eixo: 'var(--color-suave)',
  destaque: 'var(--color-primaria-suave)',
  cartao: 'var(--color-cartao)',
} as const;

export const COR_PRIORIDADE: Record<Prioridade, string> = {
  alta: 'var(--color-perigo)',
  media: 'var(--color-alerta)',
  baixa: 'var(--color-sucesso)',
};
