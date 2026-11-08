import { formatarMes, formatarPercentual, situacaoDoMes } from '../lib/resumoMensal';
import { ROTULO_PRIORIDADE, type Prioridade, type ResumoMensal } from '../lib/types';

const PRIORIDADES: Prioridade[] = ['alta', 'media', 'baixa'];
const SITUACAO = { atual: 'mês atual', futuro: 'ainda não começou' } as const;

/** Os mesmos números do gráfico, em tabela, para quem quer os valores exatos. */
export default function TabelaMensal({ resumo, hoje }: { resumo: ResumoMensal; hoje?: Date }) {
  const { meses, geral } = resumo;

  return (
    <div className="tabela-rolavel">
      <table>
        <caption className="so-leitor">Conclusão de tarefas por mês</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Tarefas</th>
            <th scope="col">Concluídas</th>
            <th scope="col">% feito</th>
            <th scope="col">% por importância</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => {
            const situacao = situacaoDoMes(m.mes, hoje);
            return (
              <tr key={m.mes}>
                <th scope="row">
                  <span>{formatarMes(m.mes)}</span>
                  {situacao !== 'passado' && <span className="tag">{SITUACAO[situacao]}</span>}
                  <small className="detalhe-prioridades">
                    {PRIORIDADES.map((p) => `${ROTULO_PRIORIDADE[p]} ${m.prioridades[p].concluidas}/${m.prioridades[p].total}`).join(' · ')}
                  </small>
                </th>
                <td>{m.total}</td>
                <td>{m.concluidas}</td>
                <td>{formatarPercentual(m.taxa)}</td>
                <td><strong>{formatarPercentual(m.taxaPonderada)}</strong></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Geral</th>
            <td>{geral.total}</td>
            <td>{geral.concluidas}</td>
            <td>{formatarPercentual(geral.taxa)}</td>
            <td><strong>{formatarPercentual(geral.taxaPonderada)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
