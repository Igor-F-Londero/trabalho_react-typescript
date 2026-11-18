/**
 * - `primario`: ação principal (preenchido);
 * - `discreto`: ação secundária, só texto/ícone colorido;
 * - `perigo`: ação destrutiva ainda por confirmar;
 * - `perigo-solido`: confirmação de uma ação destrutiva.
 */
export type Variante = 'primario' | 'discreto' | 'perigo' | 'perigo-solido';

const BASE =
  'inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-3.5 py-1.5 font-medium whitespace-nowrap ' +
  // Sobe ao passar o mouse e "afunda" ao clicar.
  'transition duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] hover:enabled:-translate-y-0.5 active:enabled:scale-90 active:enabled:duration-75 active:enabled:shadow-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria disabled:cursor-default disabled:opacity-55';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-primaria text-sobre-primaria hover:enabled:bg-primaria-forte hover:enabled:shadow-brilho',
  discreto: 'bg-transparent text-primaria hover:enabled:bg-primaria-suave',
  perigo: 'bg-transparent text-perigo hover:enabled:bg-perigo-suave',
  'perigo-solido':
    'animate-pop bg-perigo text-sobre-perigo hover:enabled:brightness-90 hover:enabled:shadow-[0_6px_12px_-4px_var(--color-perigo)]',
};

export const classesDoBotao = (variante: Variante = 'primario', extras = '') =>
  `${BASE} ${VARIANTES[variante]} ${extras}`.trim();
