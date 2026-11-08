import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import Filtros from '../components/Filtros';
import AlternarTema from '../components/AlternarTema';
import BotaoIcone from '../components/BotaoIcone';
import GrupoItem from '../components/GrupoItem';
import ListaTarefas from '../components/ListaTarefas';
import NomeForm from '../components/NomeForm';
import Resumo from '../components/Resumo';
import ResumoMensal from '../components/ResumoMensal';
import TarefaForm from '../components/TarefaForm';
import { useAcoes, useArvore } from '../hooks/useArvore';
import { useSair, useSessao } from '../hooks/useSessao';
import { RAIZ, decidirMovimento, type Arrasto } from '../lib/arrasto';
import { FILTRO_VAZIO, acharGrupo, achatarArvore, filtroAtivo, filtrarArvore, type Filtro } from '../lib/arvore';

function ZonaRaiz({ arrastando, children }: { arrastando: boolean; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: RAIZ });
  return (
    <section ref={setNodeRef} className={`raiz${isOver ? ' alvo' : ''}`}>
      <h2>Sem grupo</h2>
      {children}
      {arrastando && <p className="dica">Solte aqui para tirar do grupo</p>}
    </section>
  );
}

export default function DashboardPage() {
  const { data: arvore, error, isPending, refetch } = useArvore();
  const acoes = useAcoes();
  const sair = useSair();
  const { data: usuario } = useSessao();

  const [filtro, setFiltro] = useState<Filtro>(FILTRO_VAZIO);
  const [criandoGrupo, setCriandoGrupo] = useState(false);
  const [criandoTarefa, setCriandoTarefa] = useState(false);
  const [ativo, setAtivo] = useState<Arrasto | null>(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const visivel = useMemo(() => (arvore ? filtrarArvore(arvore, filtro) : null), [arvore, filtro]);

  if (isPending) return <p className="card" role="status">Carregando…</p>;
  if (error || !arvore || !visivel) {
    return (
      <div className="card">
        <p className="erro" role="alert">{error?.message ?? 'Erro ao carregar'}</p>
        <BotaoIcone icone="recarregar" rotulo="Tentar de novo" onClick={() => refetch()} />
      </div>
    );
  }

  const plana = achatarArvore(arvore);
  const nomeAtivo = !ativo
    ? ''
    : ativo.tipo === 'tarefa'
      ? plana.tarefas.find((t) => t._id === ativo.id)?.titulo
      : acharGrupo(arvore.grupos, ativo.id)?.nome;

  const aoSoltar = ({ active, over }: DragEndEvent) => {
    setAtivo(null);
    if (!over) return;
    const destino = over.id === RAIZ ? null : (over.data.current as Arrasto).id;
    const movimento = decidirMovimento(arvore, active.data.current as Arrasto, destino);
    if (movimento?.tipo === 'tarefa') acoes.atualizarTarefa(movimento.id, movimento.dados);
    else if (movimento) acoes.atualizarGrupo(movimento.id, movimento.dados);
  };

  const aoComecar = ({ active }: DragStartEvent) => setAtivo(active.data.current as Arrasto);

  const filtrando = filtroAtivo(filtro);
  const semResultados = !visivel.grupos.length && !visivel.tarefasSemGrupo.length;
  const semDados = !arvore.grupos.length && !arvore.tarefasSemGrupo.length;

  return (
    <div className="dashboard">
      <header className="topo">
        <div>
          <h1>Minhas tarefas</h1>
          {usuario && <p className="saudacao">Olá, {usuario.nome}</p>}
        </div>
        <div className="topo-acoes">
          <AlternarTema />
          <BotaoIcone icone="pasta" rotulo="Novo grupo" onClick={() => setCriandoGrupo(true)} />
          <BotaoIcone icone="tarefaMais" rotulo="Nova tarefa sem grupo" onClick={() => setCriandoTarefa(true)} />
          <BotaoIcone icone="sair" rotulo="Sair da conta" className="link" onClick={sair} />
        </div>
      </header>

      <Resumo arvore={arvore} />
      {!semDados && (
        <>
          <ResumoMensal />
          <Filtros filtro={filtro} onChange={setFiltro} />
          <p className="dica">
            Arraste uma tarefa para dentro de um grupo para organizá-la (ou para "Sem grupo" para soltá-la).
          </p>
        </>
      )}

      {criandoGrupo && (
        <div className="card form-topo">
          <NomeForm
            rotulo="Nome do grupo (ex.: Faculdade)"
            onCancelar={() => setCriandoGrupo(false)}
            onSalvar={(nome) => {
              setCriandoGrupo(false);
              acoes.criarGrupo({ nome, pai: null });
            }}
          />
        </div>
      )}

      {criandoTarefa && (
        <div className="card form-topo">
          <TarefaForm
            onCancelar={() => setCriandoTarefa(false)}
            onSalvar={async (d) => {
              await acoes.criarTarefa(d);
              setCriandoTarefa(false);
            }}
          />
        </div>
      )}

      <DndContext
        sensors={sensores}
        collisionDetection={pointerWithin}
        onDragStart={aoComecar}
        onDragEnd={aoSoltar}
        onDragCancel={() => setAtivo(null)}
      >
        <ul className="arvore">
          {visivel.grupos.map((g) => (
            <GrupoItem key={g._id} no={g} forcarAberto={filtrando} />
          ))}
        </ul>

        {(visivel.tarefasSemGrupo.length > 0 || ativo) && (
          <ZonaRaiz arrastando={!!ativo}>
            <ul>
              <ListaTarefas tarefas={visivel.tarefasSemGrupo} />
            </ul>
          </ZonaRaiz>
        )}

        <DragOverlay>{nomeAtivo && <div className="overlay">{nomeAtivo}</div>}</DragOverlay>
      </DndContext>

      {semDados && (
        <div className="card estado-vazio">
          <p className="estado-vazio-titulo">Você ainda não tem grupos</p>
          <p className="dica">Crie um grupo (ex.: Faculdade) e organize suas tarefas dentro dele.</p>
          <BotaoIcone icone="pasta" rotulo="Criar primeiro grupo" onClick={() => setCriandoGrupo(true)} />
        </div>
      )}
      {!semDados && semResultados && filtrando && <p className="vazio">Nenhuma tarefa corresponde aos filtros.</p>}
    </div>
  );
}

