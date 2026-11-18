// Classes do Tailwind repetidas em mais de um componente. Ficam num lugar só para o visual não divergir.

export const CARTAO = 'rounded-xl border border-borda bg-cartao p-4 shadow-cartao';
export const TITULO_SECAO = 'mb-2 text-xs font-semibold tracking-wider text-suave uppercase';
export const DICA = 'my-2 text-sm text-suave';
export const ERRO = 'text-sm text-perigo';

/** Botão quadrado e discreto (seta de abrir/recolher, alça de arrastar): sem o "pulo" dos botões de ação. */
export const BOTAO_SUTIL =
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-transparent p-0 text-suave transition-colors ' +
  'hover:bg-cartao-sub focus-visible:outline-2 focus-visible:outline-primaria max-sm:size-7';

/** Alvo de soltar enquanto algo é arrastado por cima dele. */
export const ALVO_DE_SOLTAR = 'bg-primaria-suave outline-2 outline-primaria';
