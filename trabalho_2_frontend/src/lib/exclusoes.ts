/** Quanto tempo o aviso "Desfazer" fica disponível antes de a exclusão ir de fato ao servidor. */
export const ESPERA_DESFAZER = 6000;

interface Pendente {
  ids: string[];
  executar: () => Promise<void>;
  timer: ReturnType<typeof setTimeout>;
  /** Preenchida quando a exclusão começa; a partir daí não dá mais para desfazer. */
  promessa?: Promise<void>;
}

const pendentes = new Set<Pendente>();
const ouvintes = new Set<() => void>();
let ocultos: ReadonlySet<string> = new Set();

/** Recalcula os ids ocultos (um Set novo a cada mudança, para o `useSyncExternalStore` perceber). */
function atualizar() {
  ocultos = new Set([...pendentes].flatMap((p) => p.ids));
  ouvintes.forEach((fn) => fn());
}

export const assinarOcultos = (fn: () => void) => {
  ouvintes.add(fn);
  return () => void ouvintes.delete(fn);
};

/** Ids de itens excluídos na tela mas ainda não apagados no servidor. */
export const idsOcultos = () => ocultos;

/** Executa a exclusão uma única vez; o item só deixa de ficar oculto depois que `executar` termina. */
function rodar(p: Pendente) {
  p.promessa ??= (async () => {
    clearTimeout(p.timer);
    try {
      await p.executar();
    } finally {
      pendentes.delete(p);
      atualizar();
    }
  })();
  return p.promessa;
}

/**
 * Esconde os `ids` agora e só chama `executar` depois de `espera` ms, a não ser que `desfazer` seja chamado.
 * `executar` deve tratar os próprios erros (ex.: avisar o usuário).
 */
export function adiarExclusao(ids: string[], executar: () => Promise<void>, espera = ESPERA_DESFAZER) {
  const p: Pendente = {
    ids,
    executar,
    timer: setTimeout(() => void rodar(p).catch(console.error), espera),
  };
  pendentes.add(p);
  atualizar();
  return {
    desfazer() {
      if (p.promessa) return;
      clearTimeout(p.timer);
      pendentes.delete(p);
      atualizar();
    },
  };
}

/** Executa agora todas as exclusões que ainda esperavam (ex.: antes de sair da conta). */
export async function confirmarPendentes() {
  await Promise.all([...pendentes].map(rodar));
}

/** Desfaz todas as exclusões que ainda não começaram. */
export function cancelarPendentes() {
  for (const p of [...pendentes]) {
    if (p.promessa) continue;
    clearTimeout(p.timer);
    pendentes.delete(p);
  }
  atualizar();
}
