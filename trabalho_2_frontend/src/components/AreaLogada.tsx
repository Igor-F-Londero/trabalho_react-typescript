import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useSessao } from '../hooks/useSessao';
import Cabecalho from './Cabecalho';
import { CARTAO } from './estilos';

/** Rota-pai das páginas que exigem login: sem sessão, leva ao `/login`; com sessão, mostra o cabeçalho e a página. */
export default function AreaLogada() {
  const { data: usuario } = useSessao();
  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-5xl px-3 pt-5 pb-16 sm:px-4 sm:pt-6">
        <Suspense fallback={<p role="status" className={CARTAO}>Carregando…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
