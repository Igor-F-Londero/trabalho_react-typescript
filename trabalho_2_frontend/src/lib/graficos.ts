import { formatarMes, formatarMesCurto, formatarPercentual, situacaoDoMes } from './resumoMensal';
import { ROTULO_PRIORIDADE, type MesResumo, type Prioridade } from './types';

/** Da mais importante para a menos: é a ordem em que aparecem nos gráficos e nas legendas. */
export const PRIORIDADES: Prioridade[] = ['alta', 'media', 'baixa'];

export interface PontoConclusao {
  mes: string;
  rotulo: string;
  feito: number;
  importancia: number;
  /** É o mês de hoje (ganha destaque no eixo). */
  atual: boolean;
}

export interface PontoEvolucao {
  mes: string;
  rotulo: string;
  total: number;
  concluidas: number;
  pendentes: number;
}

export interface FatiaPrioridade {
  prioridade: Prioridade;
  rotulo: string;
  total: number;
  concluidas: number;
  pendentes: number;
}

export function dadosConclusao(meses: MesResumo[], hoje?: Date): PontoConclusao[] {
  return meses.map((m) => ({
    mes: m.mes,
    rotulo: formatarMesCurto(m.mes),
    feito: m.taxa,
    importancia: m.taxaPonderada,
    atual: situacaoDoMes(m.mes, hoje) === 'atual',
  }));
}

export function dadosEvolucao(meses: MesResumo[]): PontoEvolucao[] {
  return meses.map((m) => ({
    mes: m.mes,
    rotulo: formatarMesCurto(m.mes),
    total: m.total,
    concluidas: m.concluidas,
    pendentes: m.total - m.concluidas,
  }));
}

/** Soma todos os meses: quantas tarefas de cada prioridade existem e quantas já foram feitas. */
export function dadosPrioridades(meses: MesResumo[]): FatiaPrioridade[] {
  return PRIORIDADES.map((prioridade) => {
    const total = meses.reduce((soma, m) => soma + m.prioridades[prioridade].total, 0);
    const concluidas = meses.reduce((soma, m) => soma + m.prioridades[prioridade].concluidas, 0);
    return { prioridade, rotulo: ROTULO_PRIORIDADE[prioridade], total, concluidas, pendentes: total - concluidas };
  });
}

/** Posição do mês que começa em destaque: o atual ou, na falta dele, o mais recente que já começou. */
export function indiceDoMesEmDestaque(meses: MesResumo[], hoje?: Date) {
  for (let i = meses.length - 1; i >= 0; i--) if (situacaoDoMes(meses[i].mes, hoje) !== 'futuro') return i;
  return 0;
}

/** "Alta 3/4 · Média 2/4 · Baixa 1/1" (concluídas/total de cada prioridade). */
const porPrioridade = (m: MesResumo) =>
  PRIORIDADES.map((p) => `${ROTULO_PRIORIDADE[p]} ${m.prioridades[p].concluidas}/${m.prioridades[p].total}`).join(' · ');

const SITUACAO = { passado: '', atual: ' É o mês atual.', futuro: ' O mês ainda não começou.' } as const;

/** Frase completa de um mês, para leitores de tela (o desenho em si não é lido). */
export function descreverMes(m: MesResumo, hoje?: Date) {
  return (
    `${formatarMes(m.mes)}: ${formatarPercentual(m.taxa)} feito e ${formatarPercentual(m.taxaPonderada)} por importância. ` +
    `${m.concluidas} de ${m.total} tarefas concluídas. ${porPrioridade(m)}.${SITUACAO[situacaoDoMes(m.mes, hoje)]}`
  );
}

export const descreverResumo = (meses: MesResumo[], hoje?: Date) =>
  `Conclusão por mês. ${meses.map((m) => descreverMes(m, hoje)).join(' ')}`;

export const descreverEvolucao = (pontos: PontoEvolucao[]) =>
  `Evolução das tarefas por mês. ${pontos.map((p) => `${p.rotulo}: ${p.total} tarefas, ${p.concluidas} concluídas.`).join(' ')}`;

export const descreverPrioridades = (fatias: FatiaPrioridade[]) =>
  `Tarefas por prioridade. ${fatias.map((f) => `${f.rotulo}: ${f.concluidas} de ${f.total} concluídas.`).join(' ')}`;
