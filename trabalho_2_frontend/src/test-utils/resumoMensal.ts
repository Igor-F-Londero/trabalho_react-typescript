import type { ResumoMensal } from '../lib/types';

/** Resumo de exemplo compartilhado pelos testes: outubro (já com tarefas feitas) e novembro (nada feito ainda). */
export const resumoDeTeste: ResumoMensal = {
  pesos: { alta: 3, media: 2, baixa: 1 },
  meses: [
    {
      mes: '2026-10',
      total: 9,
      concluidas: 6,
      taxa: 66.7,
      taxaPonderada: 52.4,
      prioridades: {
        alta: { total: 3, concluidas: 2 },
        media: { total: 4, concluidas: 3 },
        baixa: { total: 2, concluidas: 1 },
      },
    },
    {
      mes: '2026-11',
      total: 10,
      concluidas: 0,
      taxa: 0,
      taxaPonderada: 0,
      prioridades: {
        alta: { total: 1, concluidas: 0 },
        media: { total: 5, concluidas: 0 },
        baixa: { total: 4, concluidas: 0 },
      },
    },
  ],
  geral: {
    total: 19,
    concluidas: 6,
    taxa: 31.6,
    taxaPonderada: 35,
    mediaTarefasPorMes: 9.5,
    mediaConcluidasPorMes: 3,
    semPrazo: 5,
  },
};
