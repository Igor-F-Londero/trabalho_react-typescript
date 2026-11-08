export type Tema = 'claro' | 'escuro';

/** Mesma chave usada pelo script de `index.html`, que aplica o tema antes da primeira pintura. */
const CHAVE = 'tema';

const consultaEscuro = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

/** Tema que o usuário escolheu no botão, ou `null` se ainda não escolheu (aí vale o do sistema). */
export function temaSalvo(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === 'claro' || valor === 'escuro' ? valor : null;
  } catch {
    return null;
  }
}

export function salvarTema(tema: Tema) {
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // Sem armazenamento (ex.: navegação privada): a escolha só vale até recarregar a página.
  }
}

/** Tema que o sistema operacional ou o navegador pede (`prefers-color-scheme`). */
export const temaDoSistema = (): Tema => (consultaEscuro()?.matches ? 'escuro' : 'claro');

/** Marca o `<html>` com o tema escolhido; `null` remove a marca e o CSS volta a seguir o sistema. */
export function aplicarTema(tema: Tema | null) {
  if (tema) document.documentElement.dataset.tema = tema;
  else delete document.documentElement.dataset.tema;
}

/** Avisa quando o sistema muda de tema (ex.: o agendamento automático claro/escuro do sistema). */
export function aoMudarTemaDoSistema(fn: () => void) {
  const consulta = consultaEscuro();
  consulta?.addEventListener('change', fn);
  return () => consulta?.removeEventListener('change', fn);
}
