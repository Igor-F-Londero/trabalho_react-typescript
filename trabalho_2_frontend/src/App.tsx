import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { ToastProvider } from './hooks/useToast';
import { encerrarSessaoLocal, useSessao } from './hooks/useSessao';
import { ApiError } from './services/api';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

function criarClient() {
  // Sessão expirada em qualquer requisição: zera a sessão e a guarda de rota leva ao login.
  const aoFalhar = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) encerrarSessaoLocal(client);
  };
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: aoFalhar }),
    mutationCache: new MutationCache({ onError: aoFalhar }),
    defaultOptions: {
      queries: { retry: (n, err) => !(err instanceof ApiError) && n < 2, refetchOnWindowFocus: false },
    },
  });
  return client;
}

function Rotas() {
  const { data: usuario, isPending } = useSessao();
  // Antes de o servidor responder não dá para saber se há sessão: evita piscar a tela de login.
  if (isPending) return null;
  const logado = !!usuario;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={logado ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={logado ? <DashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const [client] = useState(criarClient);

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <Rotas />
      </ToastProvider>
    </QueryClientProvider>
  );
}
