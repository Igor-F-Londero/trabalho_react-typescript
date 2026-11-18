import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { GrupoNaoVazio, useAcoes } from '../hooks/useArvore';
import { useGrupoAberto } from '../hooks/useGrupoAberto';
import { useToast } from '../hooks/useToast';
import { mensagemDeErro } from '../services/api';
import { idDnd, type Arrasto } from '../lib/arrasto';
import { todasTarefas } from '../lib/arvore';
import type { GrupoNo } from '../lib/types';
import ConfirmButton from './ConfirmButton';
import { ALVO_DE_SOLTAR, BOTAO_SUTIL, DICA, ERRO } from './estilos';
import BotaoIcone from './BotaoIcone';
import Icone from './Icone';
import NomeForm from './NomeForm';
import TarefaForm from './TarefaForm';
import ListaTarefas from './ListaTarefas';

interface Props {
  no: GrupoNo;
  forcarAberto: boolean;
  /** É um subgrupo: fica num tom mais fundo para o aninhamento ser visível. */
  aninhado?: boolean;
}

export default function GrupoItem({ no, forcarAberto, aninhado = false }: Props) {
  const acoes = useAcoes();
  const avisar = useToast();
  const [aberto, setAberto] = useGrupoAberto(no._id);
  const [criandoTarefa, setCriandoTarefa] = useState(false);
  const [criandoSub, setCriandoSub] = useState(false);
  const [renomeando, setRenomeando] = useState(false);
  const [excluirTudo, setExcluirTudo] = useState(false);

  const arrasto: Arrasto = { tipo: 'grupo', id: no._id };
  const drag = useDraggable({ id: idDnd(arrasto), data: arrasto });
  const drop = useDroppable({ id: idDnd(arrasto), data: arrasto });

  const mostrar = aberto || forcarAberto;
  const tarefas = todasTarefas(no);
  const feitas = tarefas.filter((t) => t.status === 'concluida').length;

  const excluir = async () => {
    try {
      await acoes.excluirGrupo(no._id, false);
    } catch (err) {
      if (err instanceof GrupoNaoVazio) setExcluirTudo(true);
      else avisar(mensagemDeErro(err));
    }
  };
  const excluirCascata = () =>
    acoes.excluirGrupo(no._id, true).catch((e) => avisar(mensagemDeErro(e)));

  return (
    <li
      ref={(el) => {
        drag.setNodeRef(el);
        drop.setNodeRef(el);
      }}
      className={`rounded-lg border border-borda px-3 py-2 max-sm:p-1.5 ${aninhado ? 'mt-2 bg-cartao-sub' : 'bg-cartao shadow-cartao'} ${drop.isOver ? ALVO_DE_SOLTAR : ''} ${drag.isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex min-h-10 flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`${BOTAO_SUTIL} cursor-grab touch-none active:cursor-grabbing`}
          aria-label={`Arrastar grupo ${no.nome}`}
          title="Arraste para dentro de outro grupo"
          {...drag.attributes}
          {...drag.listeners}
        >
          <Icone nome="alca" />
        </button>
        {!forcarAberto && (
          <button
            type="button"
            className={`${BOTAO_SUTIL} [&[aria-expanded=true]_.icone]:rotate-90`}
            aria-expanded={mostrar}
            aria-label={`${mostrar ? 'Recolher' : 'Abrir'} ${no.nome}`}
            title={`${mostrar ? 'Recolher' : 'Abrir'} ${no.nome}`}
            onClick={() => setAberto(!aberto)}
          >
            <Icone nome="seta" />
          </button>
        )}
        {renomeando ? (
          <NomeForm
            rotulo="Novo nome"
            inicial={no.nome}
            onCancelar={() => setRenomeando(false)}
            onSalvar={(nome) => {
              setRenomeando(false);
              acoes.atualizarGrupo(no._id, { nome });
            }}
          />
        ) : (
          <>
            <span className="inline-flex text-suave"><Icone nome="pastaSimples" /></span>
            <strong className="font-semibold">{no.nome}</strong>
          </>
        )}
        {tarefas.length > 0 && (
          <span className={`rounded-full border border-borda px-2 text-xs text-suave ${aninhado ? 'bg-cartao' : 'bg-cartao-sub'}`}>
            {feitas}/{tarefas.length}
          </span>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-0.5 max-sm:ml-0 max-sm:w-full">
          <BotaoIcone icone="tarefaMais" rotulo={`Nova tarefa em ${no.nome}`} variante="discreto" onClick={() => { setAberto(true); setCriandoTarefa(true); }} />
          <BotaoIcone icone="subpasta" rotulo={`Novo subgrupo em ${no.nome}`} variante="discreto" onClick={() => { setAberto(true); setCriandoSub(true); }} />
          <BotaoIcone icone="lapis" rotulo={`Renomear ${no.nome}`} variante="discreto" onClick={() => setRenomeando(true)} />
          {excluirTudo ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <span className={ERRO}>Tem conteúdo. Excluir tudo?</span>
              <BotaoIcone icone="lixeira" rotulo={`Excluir ${no.nome} e todo o conteúdo`} variante="perigo-solido" onClick={excluirCascata} />
              <BotaoIcone icone="x" rotulo="Cancelar exclusão" variante="discreto" onClick={() => setExcluirTudo(false)} />
            </span>
          ) : (
            <ConfirmButton onConfirmar={excluir} rotulo={`Excluir ${no.nome}`} />
          )}
        </span>
      </div>

      {mostrar && (
        <div className="my-1 ml-4 border-l-2 border-borda pl-3 max-sm:ml-0 max-sm:pl-1.5">
          {criandoSub && (
            <NomeForm
              rotulo="Nome do subgrupo"
              onCancelar={() => setCriandoSub(false)}
              onSalvar={(nome) => {
                setCriandoSub(false);
                acoes.criarGrupo({ nome, pai: no._id });
              }}
            />
          )}
          {criandoTarefa && (
            <TarefaForm
              onCancelar={() => setCriandoTarefa(false)}
              onSalvar={async (d) => {
                await acoes.criarTarefa({ ...d, grupo: no._id });
                setCriandoTarefa(false);
              }}
            />
          )}
          {!no.tarefas.length && !no.subgrupos.length && !criandoTarefa && !criandoSub && (
            <p className={DICA}>Grupo vazio</p>
          )}
          <ul>
            <ListaTarefas tarefas={no.tarefas} />
            {no.subgrupos.map((sub) => (
              <GrupoItem key={sub._id} no={sub} forcarAberto={forcarAberto} aninhado />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
