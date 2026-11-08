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
import BotaoIcone from './BotaoIcone';
import Icone from './Icone';
import NomeForm from './NomeForm';
import TarefaForm from './TarefaForm';
import ListaTarefas from './ListaTarefas';

export default function GrupoItem({ no, forcarAberto }: { no: GrupoNo; forcarAberto: boolean }) {
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
      className={`grupo${drop.isOver ? ' alvo' : ''}${drag.isDragging ? ' arrastando' : ''}`}
    >
      <div className="grupo-cabecalho">
        <button
          type="button"
          className="alca"
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
            className="seta"
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
            <span className="icone-grupo"><Icone nome="pastaSimples" /></span>
            <strong>{no.nome}</strong>
          </>
        )}
        {tarefas.length > 0 && <span className="contador">{feitas}/{tarefas.length}</span>}
        <span className="acoes">
          <BotaoIcone icone="tarefaMais" rotulo={`Nova tarefa em ${no.nome}`} className="link" onClick={() => { setAberto(true); setCriandoTarefa(true); }} />
          <BotaoIcone icone="subpasta" rotulo={`Novo subgrupo em ${no.nome}`} className="link" onClick={() => { setAberto(true); setCriandoSub(true); }} />
          <BotaoIcone icone="lapis" rotulo={`Renomear ${no.nome}`} className="link" onClick={() => setRenomeando(true)} />
          {excluirTudo ? (
            <span className="linha">
              <span className="erro">Tem conteúdo. Excluir tudo?</span>
              <BotaoIcone icone="lixeira" rotulo={`Excluir ${no.nome} e todo o conteúdo`} className="perigo-solido" onClick={excluirCascata} />
              <BotaoIcone icone="x" rotulo="Cancelar exclusão" className="link" onClick={() => setExcluirTudo(false)} />
            </span>
          ) : (
            <ConfirmButton onConfirmar={excluir} rotulo={`Excluir ${no.nome}`} />
          )}
        </span>
      </div>

      {mostrar && (
        <div className="grupo-corpo">
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
            <p className="dica">Grupo vazio</p>
          )}
          <ul>
            <ListaTarefas tarefas={no.tarefas} />
            {no.subgrupos.map((sub) => (
              <GrupoItem key={sub._id} no={sub} forcarAberto={forcarAberto} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
