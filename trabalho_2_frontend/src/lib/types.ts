export type Status = 'pendente' | 'em_andamento' | 'concluida';
export type Prioridade = 'baixa' | 'media' | 'alta';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface Tarefa {
  _id: string;
  titulo: string;
  descricao?: string;
  status: Status;
  prioridade: Prioridade;
  prazo?: string;
  grupo: string | null;
}

export interface Grupo {
  _id: string;
  nome: string;
  pai: string | null;
}

export interface GrupoNo extends Grupo {
  subgrupos: GrupoNo[];
  tarefas: Tarefa[];
}

export interface Arvore {
  grupos: GrupoNo[];
  tarefasSemGrupo: Tarefa[];
}

export interface Contagem {
  total: number;
  concluidas: number;
}

export interface MesResumo {
  /** Mês do prazo no formato AAAA-MM. */
  mes: string;
  total: number;
  concluidas: number;
  /** Concluídas / total, em %. */
  taxa: number;
  /** Mesma taxa, mas cada tarefa conta com o peso da sua prioridade. */
  taxaPonderada: number;
  prioridades: Record<Prioridade, Contagem>;
}

export interface ResumoMensal {
  pesos: Record<Prioridade, number>;
  meses: MesResumo[];
  geral: {
    total: number;
    concluidas: number;
    taxa: number;
    taxaPonderada: number;
    mediaTarefasPorMes: number;
    mediaConcluidasPorMes: number;
    /** Tarefas sem prazo, que não entram no resumo. */
    semPrazo: number;
  };
}

export const ROTULO_STATUS: Record<Status, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};
