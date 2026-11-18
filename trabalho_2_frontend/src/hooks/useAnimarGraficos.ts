/** Os gráficos só se animam se a pessoa não pediu "reduzir movimento" no sistema (o jsdom dos testes não tem matchMedia). */
export const useAnimarGraficos = () =>
  typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
