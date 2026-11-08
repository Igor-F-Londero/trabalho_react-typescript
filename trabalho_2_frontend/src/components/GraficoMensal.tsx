import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { formatarMes, formatarMesCurto, formatarPercentual, situacaoDoMes } from '../lib/resumoMensal';
import { ROTULO_PRIORIDADE, type MesResumo, type Prioridade } from '../lib/types';

const PRIORIDADES: Prioridade[] = ['alta', 'media', 'baixa'];

/** "Alta 3/4 · Média 2/4 · Baixa 1/1" (concluídas/total de cada prioridade). */
const porPrioridade = (m: MesResumo) =>
  PRIORIDADES.map((p) => `${ROTULO_PRIORIDADE[p]} ${m.prioridades[p].concluidas}/${m.prioridades[p].total}`).join(' · ');

const SITUACAO = { passado: '', atual: ' É o mês atual.', futuro: ' O mês ainda não começou.' } as const;

/** Frase completa de uma coluna, para leitores de tela (as barras em si são decorativas). */
function descricao(m: MesResumo, situacao: keyof typeof SITUACAO) {
  return (
    `${formatarMes(m.mes)}: ${formatarPercentual(m.taxa)} feito e ${formatarPercentual(m.taxaPonderada)} por importância. ` +
    `${m.concluidas} de ${m.total} tarefas concluídas. ${porPrioridade(m)}.${SITUACAO[situacao]}`
  );
}

/** Coluna que começa em destaque: o mês atual ou, na falta dele, o mais recente que já começou. */
function colunaInicial(meses: MesResumo[], hoje?: Date) {
  for (let i = meses.length - 1; i >= 0; i--) if (situacaoDoMes(meses[i].mes, hoje) !== 'futuro') return i;
  return 0;
}

/** Gráfico de barras por mês: "% feito" ao lado de "% por importância", com animação de entrada. */
/** `hoje` só existe para os testes fixarem a data; sem ele vale o dia de hoje. */
export default function GraficoMensal({ meses, hoje }: { meses: MesResumo[]; hoje?: Date }) {
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const colunasRef = useRef<HTMLUListElement>(null);

  // Em telas estreitas as colunas rolam na horizontal: ao abrir, centraliza o mês em destaque (o scroll é só do gráfico).
  useEffect(() => {
    const lista = colunasRef.current;
    const ativa = lista?.querySelector<HTMLElement>('[data-ativo="true"]');
    if (lista && ativa) lista.scrollLeft = Math.max(0, ativa.offsetLeft - (lista.clientWidth - ativa.offsetWidth) / 2);
  }, []);
  const ativa = Math.min(escolhida ?? colunaInicial(meses, hoje), meses.length - 1);
  const mesAtivo = meses[ativa];

  return (
    <div className="grafico">
      <div className="grafico-escala" aria-hidden="true">
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>
      <ul ref={colunasRef} className="grafico-colunas" aria-label="Conclusão por mês">
        {meses.map((m, i) => {
          const situacao = situacaoDoMes(m.mes, hoje);
          return (
            <li
              key={m.mes}
              className="grafico-mes"
              tabIndex={0}
              aria-label={descricao(m, situacao)}
              data-ativo={i === ativa}
              style={{ '--i': i } as CSSProperties}
              onMouseEnter={() => setEscolhida(i)}
              onFocus={() => setEscolhida(i)}
              onClick={() => setEscolhida(i)}
            >
              <div className="grafico-barras" aria-hidden="true">
                <span className="grafico-barra barra-feito" style={{ height: `${m.taxa}%` }}>
                  <em>{formatarPercentual(m.taxa)}</em>
                </span>
                <span className="grafico-barra barra-importancia" style={{ height: `${m.taxaPonderada}%` }}>
                  <em>{formatarPercentual(m.taxaPonderada)}</em>
                </span>
              </div>
              <span className="grafico-rotulo" aria-hidden="true">
                {formatarMesCurto(m.mes)}
                {situacao === 'atual' && <small>atual</small>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="grafico-detalhe" aria-hidden="true">
        <strong>{formatarMes(mesAtivo.mes)}:</strong> {mesAtivo.concluidas} de {mesAtivo.total} tarefas · {porPrioridade(mesAtivo)}
      </p>
      <p className="grafico-legenda" aria-hidden="true">
        <span><i className="cor-feito" />% feito</span>
        <span><i className="cor-importancia" />% por importância</span>
      </p>
    </div>
  );
}
