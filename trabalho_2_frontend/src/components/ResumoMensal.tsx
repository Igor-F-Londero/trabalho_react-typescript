import { useId, useState } from 'react';
import { useResumoMensal } from '../hooks/useResumoMensal';
import { formatarMedia, formatarPercentual } from '../lib/resumoMensal';
import { mensagemDeErro } from '../services/api';
import AnelProgresso from './AnelProgresso';
import BotaoIcone from './BotaoIcone';
import GraficoMensal from './GraficoMensal';
import Icone from './Icone';
import TabelaMensal from './TabelaMensal';

/** Conclusão por mês (pelo prazo): anel com o avanço geral, números-chave e gráfico; o resto é sob demanda. */
export default function ResumoMensal() {
  const [aberto, setAberto] = useState(false);
  const [explicando, setExplicando] = useState(false);
  const [tabela, setTabela] = useState(false);
  const { data, error, isPending } = useResumoMensal(aberto);
  const id = useId();

  return (
    <section className="card resumo-mensal">
      <button
        type="button"
        className="link resumo-mensal-toggle"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto(!aberto)}
      >
        <Icone nome="seta" />
        <span>Resumo mensal</span>
      </button>

      {aberto && (
        <div id={id} className="resumo-mensal-corpo">
          {isPending && <p role="status">Carregando…</p>}
          {error && <p className="erro" role="alert">{mensagemDeErro(error)}</p>}
          {data && !data.meses.length && (
            <p className="dica">Nenhuma tarefa com prazo ainda. Defina prazos para ver a conclusão por mês.</p>
          )}
          {data && data.meses.length > 0 && (
            <>
              <div className="resumo-visual">
                <AnelProgresso
                  valor={data.geral.taxaPonderada}
                  legenda="por importância"
                  descricao={`Avanço geral de ${formatarPercentual(data.geral.taxaPonderada)} considerando a importância das tarefas; ${formatarPercentual(data.geral.taxa)} das tarefas com prazo foram concluídas.`}
                />
                <div className="kpis" role="group" aria-label="Resumo em números">
                  <div className="kpi">
                    <strong>{data.geral.concluidas}<small>/{data.geral.total}</small></strong>
                    <span>tarefas concluídas</span>
                  </div>
                  <div className="kpi">
                    <strong>{formatarMedia(data.geral.mediaTarefasPorMes)}</strong>
                    <span>tarefas por mês</span>
                  </div>
                  <div className="kpi">
                    <strong>{formatarMedia(data.geral.mediaConcluidasPorMes)}</strong>
                    <span>concluídas por mês</span>
                  </div>
                </div>
              </div>

              <GraficoMensal meses={data.meses} />

              <div className="resumo-acoes">
                <BotaoIcone
                  icone="info"
                  rotulo="Como é calculado"
                  className="link"
                  aria-expanded={explicando}
                  onClick={() => setExplicando(!explicando)}
                />
                <BotaoIcone
                  icone="tabela"
                  rotulo="Tabela detalhada"
                  className="link"
                  aria-expanded={tabela}
                  onClick={() => setTabela(!tabela)}
                />
              </div>
              {explicando && (
                <div className="legenda">
                  <p className="dica"><strong>% feito:</strong> tarefas concluídas ÷ tarefas do mês.</p>
                  <p className="dica">
                    <strong>% por importância:</strong> o mesmo cálculo, mas cada tarefa alta vale {data.pesos.alta}, média{' '}
                    {data.pesos.media} e baixa {data.pesos.baixa}. Por isso, concluir as mais importantes faz o número subir mais.
                  </p>
                </div>
              )}
              {tabela && <TabelaMensal resumo={data} />}
            </>
          )}
          {data && data.geral.semPrazo > 0 && (
            <p className="dica">
              {data.geral.semPrazo} {data.geral.semPrazo === 1 ? 'tarefa sem prazo não entra' : 'tarefas sem prazo não entram'} no resumo.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
