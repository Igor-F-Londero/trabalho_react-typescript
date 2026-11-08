import { achatarArvore, estaDentro } from './arvore';
import type { Arvore, Grupo, Tarefa } from './types';

export type TipoArrasto = 'tarefa' | 'grupo';

/** O que está sendo arrastado (ou o destino de um grupo): vai no `data` do dnd-kit. */
export interface Arrasto {
  tipo: TipoArrasto;
  id: string;
}

/** Id da área "Sem grupo", usada como destino para tirar um item do grupo. */
export const RAIZ = 'raiz';

/** Id único no dnd-kit: uma tarefa e um grupo nunca colidem, mesmo que os ids sejam iguais. */
export const idDnd = ({ tipo, id }: Arrasto) => `${tipo}:${id}`;

export type Movimento =
  | { tipo: 'tarefa'; id: string; dados: Pick<Tarefa, 'grupo'> }
  | { tipo: 'grupo'; id: string; dados: Pick<Grupo, 'pai'> };

/**
 * Decide o que fazer quando algo é solto sobre `destino` (id do grupo, ou `null` para "Sem grupo").
 * Devolve `null` quando não há nada a fazer: mesmo lugar, item que não existe mais ou ciclo
 * (mover um grupo para dentro de si mesmo ou de um descendente).
 */
export function decidirMovimento(arvore: Arvore, { tipo, id }: Arrasto, destino: string | null): Movimento | null {
  const plana = achatarArvore(arvore);
  if (tipo === 'tarefa') {
    const atual = plana.tarefas.find((t) => t._id === id);
    return atual && atual.grupo !== destino ? { tipo, id, dados: { grupo: destino } } : null;
  }
  const atual = plana.grupos.find((g) => g._id === id);
  const ciclo = destino !== null && estaDentro(arvore.grupos, id, destino);
  return atual && !ciclo && atual.pai !== destino ? { tipo, id, dados: { pai: destino } } : null;
}
