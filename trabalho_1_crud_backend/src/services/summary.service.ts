import { Types } from 'mongoose';
import { PRIORIDADES, Task } from '../models/Task.js';
import type { MonthlySummaryQuery } from '../schemas/query.schema.js';

type Prioridade = (typeof PRIORIDADES)[number];

/** Quanto cada tarefa conta na média ponderada: tarefas mais importantes pesam mais. */
export const PESOS: Record<Prioridade, number> = { alta: 3, media: 2, baixa: 1 };

interface Contagem {
  total: number;
  concluidas: number;
}

/** Uma linha do `$group`: quantas tarefas de um mês/prioridade estão (ou não) concluídas. */
interface Linha {
  _id: { mes: string; prioridade: Prioridade; concluida: boolean };
  qtd: number;
}

const vazio = (): Contagem => ({ total: 0, concluidas: 0 });
const porPrioridade = () => ({ alta: vazio(), media: vazio(), baixa: vazio() });

/** Percentual com uma casa decimal; 0 quando não há tarefas. */
const percentual = (parte: number, todo: number) =>
  todo ? Math.round((parte / todo) * 1000) / 10 : 0;
const umaCasa = (n: number) => Math.round(n * 10) / 10;

/** Taxa de conclusão em que cada tarefa vale o peso da sua prioridade. */
function taxaPonderada(prioridades: Record<Prioridade, Contagem>) {
  let feito = 0;
  let todo = 0;
  for (const p of PRIORIDADES) {
    feito += PESOS[p] * prioridades[p].concluidas;
    todo += PESOS[p] * prioridades[p].total;
  }
  return percentual(feito, todo);
}

function totais(prioridades: Record<Prioridade, Contagem>) {
  const total = PRIORIDADES.reduce((s, p) => s + prioridades[p].total, 0);
  const concluidas = PRIORIDADES.reduce((s, p) => s + prioridades[p].concluidas, 0);
  return {
    total,
    concluidas,
    taxa: percentual(concluidas, total),
    taxaPonderada: taxaPonderada(prioridades),
  };
}

/**
 * Resumo mensal de conclusão. O mês é o do `prazo` (em UTC, como o prazo é gravado); tarefas sem prazo
 * ficam de fora e só aparecem contadas em `geral.semPrazo`.
 */
export async function monthly({ ano }: MonthlySummaryQuery, userId: string) {
  const usuario = new Types.ObjectId(userId);
  const prazo = ano
    ? { $gte: new Date(Date.UTC(ano, 0, 1)), $lt: new Date(Date.UTC(ano + 1, 0, 1)) }
    : { $ne: null };

  const [linhas, semPrazo] = await Promise.all([
    Task.aggregate<Linha>([
      { $match: { usuario, prazo } },
      {
        $group: {
          _id: {
            mes: { $dateToString: { format: '%Y-%m', date: '$prazo' } },
            prioridade: '$prioridade',
            concluida: { $eq: ['$status', 'concluida'] },
          },
          qtd: { $sum: 1 },
        },
      },
    ]),
    Task.countDocuments({ usuario, prazo: null }),
  ]);

  const porMes = new Map<string, Record<Prioridade, Contagem>>();
  const geral = porPrioridade();
  for (const { _id, qtd } of linhas) {
    const mes = porMes.get(_id.mes) ?? porMes.set(_id.mes, porPrioridade()).get(_id.mes)!;
    for (const alvo of [mes[_id.prioridade], geral[_id.prioridade]]) {
      alvo.total += qtd;
      if (_id.concluida) alvo.concluidas += qtd;
    }
  }

  const meses = [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, prioridades]) => ({ mes, ...totais(prioridades), prioridades }));

  const resumoGeral = totais(geral);
  return {
    pesos: PESOS,
    meses,
    geral: {
      ...resumoGeral,
      mediaTarefasPorMes: meses.length ? umaCasa(resumoGeral.total / meses.length) : 0,
      mediaConcluidasPorMes: meses.length ? umaCasa(resumoGeral.concluidas / meses.length) : 0,
      semPrazo,
    },
  };
}
