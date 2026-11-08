import type { Arvore, Grupo, GrupoNo, Prioridade, Status, Tarefa } from './types';

export type Ordenacao = 'padrao' | 'prazo' | 'prioridade' | 'titulo';

export interface Filtro {
  busca: string;
  status: Status | '';
  prioridade: Prioridade | '';
  atrasadas: boolean;
  ordenacao: Ordenacao;
}

export const FILTRO_VAZIO: Filtro = {
  busca: '',
  status: '',
  prioridade: '',
  atrasadas: false,
  ordenacao: 'padrao',
};

export const filtroAtivo = (f: Filtro) =>
  !!(f.busca.trim() || f.status || f.prioridade || f.atrasadas);

export interface Plana {
  grupos: Grupo[];
  tarefas: Tarefa[];
}

/** Converte a árvore em listas planas (base das atualizações otimistas). */
export function achatarArvore(a: Arvore): Plana {
  const grupos: Grupo[] = [];
  const tarefas: Tarefa[] = [];
  const visitar = (nos: GrupoNo[], pai: string | null) => {
    for (const n of nos) {
      grupos.push({ _id: n._id, nome: n.nome, pai });
      tarefas.push(...n.tarefas.map((t) => ({ ...t, grupo: n._id })));
      visitar(n.subgrupos, n._id);
    }
  };
  visitar(a.grupos, null);
  tarefas.push(...a.tarefasSemGrupo.map((t) => ({ ...t, grupo: null })));
  return { grupos, tarefas };
}

export function construirArvore({ grupos, tarefas }: Plana): Arvore {
  const nos = new Map<string, GrupoNo>(
    grupos.map((g) => [g._id, { ...g, subgrupos: [], tarefas: [] }]),
  );
  const raiz: GrupoNo[] = [];
  for (const g of grupos) {
    const no = nos.get(g._id)!;
    const pai = g.pai ? nos.get(g.pai) : undefined;
    (pai ? pai.subgrupos : raiz).push(no);
  }
  const tarefasSemGrupo: Tarefa[] = [];
  for (const t of tarefas) {
    const no = t.grupo ? nos.get(t.grupo) : undefined;
    (no ? no.tarefas : tarefasSemGrupo).push(t);
  }
  return { grupos: raiz, tarefasSemGrupo };
}

export function acharGrupo(nos: GrupoNo[], id: string): GrupoNo | undefined {
  for (const n of nos) {
    if (n._id === id) return n;
    const achado = acharGrupo(n.subgrupos, id);
    if (achado) return achado;
  }
}

/** Verdadeiro se `id` é o próprio grupo `ancestral` ou está dentro dele. */
export function estaDentro(nos: GrupoNo[], ancestral: string, id: string): boolean {
  const no = acharGrupo(nos, ancestral);
  return !!no && (no._id === id || !!acharGrupo(no.subgrupos, id));
}

export function todasTarefas(no: GrupoNo): Tarefa[] {
  return [...no.tarefas, ...no.subgrupos.flatMap(todasTarefas)];
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

export function atrasada(t: Tarefa, hoje = hojeISO()) {
  return !!t.prazo && t.status !== 'concluida' && t.prazo.slice(0, 10) < hoje;
}

export function resumo(a: Arvore) {
  const { tarefas } = achatarArvore(a);
  return {
    total: tarefas.length,
    concluidas: tarefas.filter((t) => t.status === 'concluida').length,
    atrasadas: tarefas.filter((t) => atrasada(t)).length,
  };
}

const PESO: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 };

function ordenar(tarefas: Tarefa[], o: Ordenacao): Tarefa[] {
  if (o === 'padrao') return tarefas;
  const copia = [...tarefas];
  if (o === 'titulo') return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  if (o === 'prioridade') return copia.sort((a, b) => PESO[a.prioridade] - PESO[b.prioridade]);
  return copia.sort((a, b) => (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999'));
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function casa(t: Tarefa, f: Filtro) {
  const busca = normalizar(f.busca.trim());
  if (busca && !normalizar(`${t.titulo} ${t.descricao ?? ''}`).includes(busca)) return false;
  if (f.status && t.status !== f.status) return false;
  if (f.prioridade && t.prioridade !== f.prioridade) return false;
  if (f.atrasadas && !atrasada(t)) return false;
  return true;
}

/** Aplica filtro e ordenação; com filtro ativo, grupos sem resultados somem. */
export function filtrarArvore(a: Arvore, f: Filtro): Arvore {
  const ativo = filtroAtivo(f);
  const podar = (nos: GrupoNo[]): GrupoNo[] =>
    nos.flatMap((n) => {
      const subgrupos = podar(n.subgrupos);
      const tarefas = ordenar(n.tarefas.filter((t) => casa(t, f)), f.ordenacao);
      if (ativo && !subgrupos.length && !tarefas.length) return [];
      return [{ ...n, subgrupos, tarefas }];
    });
  return {
    grupos: podar(a.grupos),
    tarefasSemGrupo: ordenar(a.tarefasSemGrupo.filter((t) => casa(t, f)), f.ordenacao),
  };
}

/** Remove da árvore os grupos (com toda a subárvore) e as tarefas cujo id está em `ids`; não altera a original. */
export function ocultarIds(arvore: Arvore, ids: ReadonlySet<string>): Arvore {
  if (!ids.size) return arvore;
  const podar = (g: GrupoNo): GrupoNo => ({
    ...g,
    subgrupos: g.subgrupos.filter((s) => !ids.has(s._id)).map(podar),
    tarefas: g.tarefas.filter((t) => !ids.has(t._id)),
  });
  return {
    grupos: arvore.grupos.filter((g) => !ids.has(g._id)).map(podar),
    tarefasSemGrupo: arvore.tarefasSemGrupo.filter((t) => !ids.has(t._id)),
  };
}
