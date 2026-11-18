import { useState } from 'react';
import BotaoIcone from '../components/BotaoIcone';
import AvancoGeral from '../components/graficos/AvancoGeral';
import GraficoConclusao from '../components/graficos/GraficoConclusao';
import GraficoEvolucao from '../components/graficos/GraficoEvolucao';
import GraficoPrioridades from '../components/graficos/GraficoPrioridades';
import { CARTAO } from '../components/estilos';
import TabelaMensal from '../components/TabelaMensal';
import { useResumoMensal } from '../hooks/useResumoMensal';
import { formatarMedia, formatarPercentual } from '../lib/resumoMensal';
import { mensagemDeErro } from '../services/api';

const TITULO_CARTAO = 'mb-3 text-sm font-semibold tracking-wide text-suave uppercase';

/** Página `/resumo`: como foi a conclusão das tarefas mês a mês (pelo prazo), em gráficos. */
export default function ResumoPage() {
  const { data, error, isPending } = useResumoMensal();
  const [explicando, setExplicando] = useState(false);
  const [tabela, setTabela] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold">Resumo mensal</h1>
        <p className="text-sm text-suave">Como andou a conclusão das suas tarefas em cada mês, pelo prazo.</p>
      </header>

      {isPending && <p role="status" className={CARTAO}>Carregando…</p>}
      {error && <p role="alert" className={`${CARTAO} text-perigo`}>{mensagemDeErro(error)}</p>}
      {data && !data.meses.length && (
        <p className={`${CARTAO} text-suave`}>Nenhuma tarefa com prazo ainda. Defina prazos para ver a conclusão por mês.</p>
      )}

      {data && data.meses.length > 0 && (
        <>
          <section className={`${CARTAO} flex flex-wrap items-center gap-x-8 gap-y-5`}>
            <div className="mx-auto sm:mx-0">
              <AvancoGeral
                valor={data.geral.taxaPonderada}
                legenda="por importância"
                descricao={`Avanço geral de ${formatarPercentual(data.geral.taxaPonderada)} considerando a importância das tarefas; ${formatarPercentual(data.geral.taxa)} das tarefas com prazo foram concluídas.`}
              />
            </div>
            <div
              role="group"
              aria-label="Resumo em números"
              className="grid min-w-0 flex-1 basis-64 grid-cols-3 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]"
            >
              <Numero destaque={<>{data.geral.concluidas}<small className="text-[0.9rem] font-medium text-suave">/{data.geral.total}</small></>} rotulo="tarefas concluídas" />
              <Numero destaque={formatarMedia(data.geral.mediaTarefasPorMes)} rotulo="tarefas por mês" />
              <Numero destaque={formatarMedia(data.geral.mediaConcluidasPorMes)} rotulo="concluídas por mês" />
            </div>
          </section>

          <section className={CARTAO}>
            <h2 className={TITULO_CARTAO}>Conclusão por mês</h2>
            <GraficoConclusao meses={data.meses} />
            <div className="mt-2 flex flex-wrap gap-1">
              <BotaoIcone icone="info" rotulo="Como é calculado" variante="discreto" aria-expanded={explicando} onClick={() => setExplicando(!explicando)} />
              <BotaoIcone icone="tabela" rotulo="Tabela detalhada" variante="discreto" aria-expanded={tabela} onClick={() => setTabela(!tabela)} />
            </div>
            {explicando && (
              <div className="mt-1 space-y-1 text-sm text-suave">
                <p><strong className="text-texto">% feito:</strong> tarefas concluídas ÷ tarefas do mês.</p>
                <p>
                  <strong className="text-texto">% por importância:</strong> o mesmo cálculo, mas cada tarefa alta vale {data.pesos.alta}, média{' '}
                  {data.pesos.media} e baixa {data.pesos.baixa}. Por isso, concluir as mais importantes faz o número subir mais.
                </p>
              </div>
            )}
            {tabela && <TabelaMensal resumo={data} />}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className={CARTAO}>
              <h2 className={TITULO_CARTAO}>Evolução</h2>
              <GraficoEvolucao meses={data.meses} />
            </section>
            <section className={CARTAO}>
              <h2 className={TITULO_CARTAO}>Por prioridade</h2>
              <GraficoPrioridades meses={data.meses} />
            </section>
          </div>
        </>
      )}

      {data && data.geral.semPrazo > 0 && (
        <p className="text-sm text-suave">
          {data.geral.semPrazo} {data.geral.semPrazo === 1 ? 'tarefa sem prazo não entra' : 'tarefas sem prazo não entram'} no resumo.
        </p>
      )}
    </div>
  );
}

function Numero({ destaque, rotulo }: { destaque: React.ReactNode; rotulo: string }) {
  return (
    <div className="flex animate-subir flex-col gap-0.5 rounded-lg bg-cartao-sub px-3.5 py-2.5 max-sm:px-2.5 max-sm:py-2">
      <strong className="text-2xl leading-tight tabular-nums max-sm:text-xl">{destaque}</strong>
      <span className="text-[0.8rem] text-suave max-sm:text-[0.72rem]">{rotulo}</span>
    </div>
  );
}
