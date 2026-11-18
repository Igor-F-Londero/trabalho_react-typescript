import { NavLink } from 'react-router';
import { useSair } from '../hooks/useSessao';
import AlternarTema from './AlternarTema';
import BotaoIcone from './BotaoIcone';

const LINK =
  'rounded-md px-3 py-1.5 text-sm font-medium text-suave transition-colors hover:bg-cartao-sub hover:text-texto ' +
  'focus-visible:outline-2 focus-visible:outline-primaria aria-[current=page]:bg-primaria-suave aria-[current=page]:text-primaria';

/** Barra de topo das páginas logadas: marca, navegação entre as telas, tema e sair. */
export default function Cabecalho() {
  const sair = useSair();

  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-cartao">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4">
        <span className="flex items-center gap-2 font-bold">
          <svg viewBox="0 0 24 24" className="size-6 text-primaria" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <path d="M8 12.5l2.7 2.7L16 9.5" />
          </svg>
          <span className="max-sm:sr-only">Tarefas</span>
        </span>

        <nav aria-label="Principal" className="flex gap-1">
          <NavLink to="/" end className={LINK}>Tarefas</NavLink>
          <NavLink to="/resumo" className={LINK}>Resumo</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <AlternarTema />
          <BotaoIcone icone="sair" rotulo="Sair da conta" variante="discreto" onClick={sair} />
        </div>
      </div>
    </header>
  );
}
