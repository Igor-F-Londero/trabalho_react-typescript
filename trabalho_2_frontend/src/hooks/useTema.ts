import { useSyncExternalStore } from 'react';
import { aoMudarTemaDoSistema, aplicarTema, salvarTema, temaDoSistema, temaSalvo, type Tema } from '../lib/tema';

const ouvintes = new Set<() => void>();

function assinar(fn: () => void) {
  ouvintes.add(fn);
  const parar = aoMudarTemaDoSistema(fn);
  return () => {
    ouvintes.delete(fn);
    parar();
  };
}

/** O que está valendo agora: a escolha do usuário ou, se não houver, o tema do sistema. */
const temaAtual = (): Tema => temaSalvo() ?? temaDoSistema();

export function useTema() {
  const tema = useSyncExternalStore(assinar, temaAtual);

  const alternar = () => {
    const novo: Tema = tema === 'escuro' ? 'claro' : 'escuro';
    salvarTema(novo);
    aplicarTema(novo);
    ouvintes.forEach((fn) => fn());
  };

  return { tema, alternar };
}
