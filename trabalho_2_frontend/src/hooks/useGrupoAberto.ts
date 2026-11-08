import { useState } from 'react';

const CHAVE = 'grupos-recolhidos';

function ler(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function gravar(ids: Set<string>) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify([...ids]));
  } catch {
    // Sem armazenamento (ex.: navegação privada): o grupo só não será lembrado.
  }
}

/** Estado aberto/recolhido de um grupo, guardado no navegador para sobreviver ao recarregar. */
export function useGrupoAberto(id: string) {
  const [aberto, setAberto] = useState(() => !ler().has(id));

  const alterar = (valor: boolean) => {
    setAberto(valor);
    const recolhidos = ler();
    if (valor) recolhidos.delete(id);
    else recolhidos.add(id);
    gravar(recolhidos);
  };

  return [aberto, alterar] as const;
}
