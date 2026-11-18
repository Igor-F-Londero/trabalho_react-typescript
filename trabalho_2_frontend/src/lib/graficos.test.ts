import { describe, expect, it } from 'vitest';
import { resumoDeTeste } from '../test-utils/resumoMensal';
import {
  dadosConclusao,
  dadosEvolucao,
  dadosPrioridades,
  descreverEvolucao,
  descreverMes,
  descreverPrioridades,
  descreverResumo,
  indiceDoMesEmDestaque,
} from './graficos';

const hoje = new Date(2026, 9, 15); // 15/10/2026: outubro é o mês atual e novembro ainda não começou
const { meses } = resumoDeTeste;

describe('dadosConclusao', () => {
  it('vira uma linha por mês, com o rótulo curto e os dois percentuais', () => {
    expect(dadosConclusao(meses, hoje)).toEqual([
      { mes: '2026-10', rotulo: 'out/26', feito: 66.7, importancia: 52.4, atual: true },
      { mes: '2026-11', rotulo: 'nov/26', feito: 0, importancia: 0, atual: false },
    ]);
  });

  it('marca como atual só o mês de hoje', () => {
    expect(dadosConclusao(meses, new Date(2026, 10, 2)).map((p) => p.atual)).toEqual([false, true]);
  });

  it('não marca ninguém quando hoje está fora dos meses mostrados', () => {
    expect(dadosConclusao(meses, new Date(2027, 0, 5)).some((p) => p.atual)).toBe(false);
  });
});

describe('dadosEvolucao', () => {
  it('traz o total, as concluídas e as que ainda faltam de cada mês', () => {
    expect(dadosEvolucao(meses)).toEqual([
      { mes: '2026-10', rotulo: 'out/26', total: 9, concluidas: 6, pendentes: 3 },
      { mes: '2026-11', rotulo: 'nov/26', total: 10, concluidas: 0, pendentes: 10 },
    ]);
  });
});

describe('dadosPrioridades', () => {
  it('soma todos os meses por prioridade, da mais importante para a menos', () => {
    expect(dadosPrioridades(meses)).toEqual([
      { prioridade: 'alta', rotulo: 'Alta', total: 4, concluidas: 2, pendentes: 2 },
      { prioridade: 'media', rotulo: 'Média', total: 9, concluidas: 3, pendentes: 6 },
      { prioridade: 'baixa', rotulo: 'Baixa', total: 6, concluidas: 1, pendentes: 5 },
    ]);
  });

  it('mantém as três prioridades mesmo sem nenhum mês', () => {
    expect(dadosPrioridades([]).map((p) => p.total)).toEqual([0, 0, 0]);
  });
});

describe('indiceDoMesEmDestaque', () => {
  it('é o mês atual', () => {
    expect(indiceDoMesEmDestaque(meses, hoje)).toBe(0);
  });

  it('na falta do mês atual, é o mais recente que já começou', () => {
    expect(indiceDoMesEmDestaque(meses, new Date(2026, 11, 3))).toBe(1);
  });

  it('se todos os meses são futuros, começa pelo primeiro', () => {
    expect(indiceDoMesEmDestaque(meses, new Date(2026, 0, 3))).toBe(0);
  });
});

describe('descrições para leitores de tela', () => {
  it('descreverMes diz o mês, os percentuais, as contagens e a prioridade', () => {
    expect(descreverMes(meses[0], hoje)).toBe(
      'outubro de 2026: 66,7% feito e 52,4% por importância. 6 de 9 tarefas concluídas. ' +
        'Alta 2/3 · Média 3/4 · Baixa 1/2. É o mês atual.',
    );
  });

  it('descreverMes avisa quando o mês ainda não começou', () => {
    expect(descreverMes(meses[1], hoje)).toMatch(/novembro de 2026: 0% feito.*O mês ainda não começou\.$/);
  });

  it('descreverResumo junta todos os meses numa única frase de ordem', () => {
    const texto = descreverResumo(meses, hoje);
    expect(texto).toMatch(/^Conclusão por mês\. /);
    expect(texto).toContain('outubro de 2026: 66,7% feito');
    expect(texto).toContain('novembro de 2026: 0% feito');
  });
});

describe('descrições dos outros gráficos', () => {
  it('descreverEvolucao conta tarefas e concluídas mês a mês', () => {
    expect(descreverEvolucao(dadosEvolucao(meses))).toBe(
      'Evolução das tarefas por mês. out/26: 9 tarefas, 6 concluídas. nov/26: 10 tarefas, 0 concluídas.',
    );
  });

  it('descreverPrioridades diz quantas de cada prioridade foram concluídas', () => {
    expect(descreverPrioridades(dadosPrioridades(meses))).toBe(
      'Tarefas por prioridade. Alta: 2 de 4 concluídas. Média: 3 de 9 concluídas. Baixa: 1 de 6 concluídas.',
    );
  });
});
