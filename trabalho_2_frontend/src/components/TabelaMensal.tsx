import { formatarMes, formatarPercentual, situacaoDoMes } from '../lib/resumoMensal';
import { ROTULO_PRIORIDADE, type Prioridade, type ResumoMensal } from '../lib/types';

const PRIORIDADES: Prioridade[] = ['alta', 'media', 'baixa'];
const CELULA = 'border-b border-borda px-2.5 py-2 whitespace-nowrap max-sm:px-[3px] max-sm:py-1.5';
const CELULA_NUM = `${CELULA} text-right`;
const RODAPE = 'border-t-2 border-borda px-2.5 py-2 text-right font-semibold whitespace-nowrap max-sm:px-[3px] max-sm:py-1.5';
const SITUACAO = { atual: 'mês atual', futuro: 'ainda não começou' } as const;

/** Os mesmos números do gráfico, em tabela, para quem quer os valores exatos. */
export default function TabelaMensal({ resumo, hoje }: { resumo: ResumoMensal; hoje?: Date }) {
  const { meses, geral } = resumo;

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-[0.9rem] tabular-nums max-sm:text-[0.8rem]">
        <caption className="sr-only">Conclusão de tarefas por mês</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2.5 py-2 text-right text-xs font-semibold tracking-wide whitespace-nowrap text-suave uppercase border-b border-borda max-sm:px-[3px] max-sm:py-1.5 max-sm:text-[0.62rem] max-sm:tracking-normal max-sm:whitespace-normal !text-left">Mês</th>
            <th scope="col" className="px-2.5 py-2 text-right text-xs font-semibold tracking-wide whitespace-nowrap text-suave uppercase border-b border-borda max-sm:px-[3px] max-sm:py-1.5 max-sm:text-[0.62rem] max-sm:tracking-normal max-sm:whitespace-normal">Tarefas</th>
            <th scope="col" className="px-2.5 py-2 text-right text-xs font-semibold tracking-wide whitespace-nowrap text-suave uppercase border-b border-borda max-sm:px-[3px] max-sm:py-1.5 max-sm:text-[0.62rem] max-sm:tracking-normal max-sm:whitespace-normal">Concluídas</th>
            <th scope="col" className="px-2.5 py-2 text-right text-xs font-semibold tracking-wide whitespace-nowrap text-suave uppercase border-b border-borda max-sm:px-[3px] max-sm:py-1.5 max-sm:text-[0.62rem] max-sm:tracking-normal max-sm:whitespace-normal">% feito</th>
            <th scope="col" className="px-2.5 py-2 text-right text-xs font-semibold tracking-wide whitespace-nowrap text-suave uppercase border-b border-borda max-sm:px-[3px] max-sm:py-1.5 max-sm:text-[0.62rem] max-sm:tracking-normal max-sm:whitespace-normal">% por importância</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => {
            const situacao = situacaoDoMes(m.mes, hoje);
            return (
              <tr key={m.mes}>
                <th scope="row" className={`${CELULA} text-left font-medium max-sm:whitespace-normal`}>
                  <span>{formatarMes(m.mes)}</span>
                  {situacao !== 'passado' && (
                    <span className="ml-1.5 inline-block rounded-full border border-borda bg-cartao-sub px-2 text-xs font-medium text-suave max-sm:ml-0 max-sm:mt-0.5 max-sm:whitespace-normal max-sm:rounded-lg max-sm:text-left max-sm:leading-tight">
                      {SITUACAO[situacao]}
                    </span>
                  )}
                  <small className="mt-0.5 block text-xs font-normal text-suave">
                    {PRIORIDADES.map((p) => `${ROTULO_PRIORIDADE[p]} ${m.prioridades[p].concluidas}/${m.prioridades[p].total}`).join(' · ')}
                  </small>
                </th>
                <td className={CELULA_NUM}>{m.total}</td>
                <td className={CELULA_NUM}>{m.concluidas}</td>
                <td className={CELULA_NUM}>{formatarPercentual(m.taxa)}</td>
                <td className={CELULA_NUM}><strong>{formatarPercentual(m.taxaPonderada)}</strong></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className={`${RODAPE} text-left`}>Geral</th>
            <td className={RODAPE}>{geral.total}</td>
            <td className={RODAPE}>{geral.concluidas}</td>
            <td className={RODAPE}>{formatarPercentual(geral.taxa)}</td>
            <td className={RODAPE}><strong>{formatarPercentual(geral.taxaPonderada)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
