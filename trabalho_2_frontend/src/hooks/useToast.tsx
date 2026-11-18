import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import BotaoIcone from '../components/BotaoIcone';
import type { NomeIcone } from '../components/Icone';

interface Acao {
  /** Descreve a ação (nome acessível e dica); o botão do aviso mostra só o `icone`. */
  rotulo: string;
  icone: NomeIcone;
  aoClicar: () => void;
}

interface Toast {
  id: number;
  texto: string;
  tipo: 'erro' | 'ok';
  acao?: Acao;
}

interface Opcoes {
  /** Quanto o aviso fica na tela, em ms (padrão: 5 s para erros e 3 s para sucesso). */
  duracao?: number;
  /** Botão dentro do aviso (ex.: "Desfazer"); clicar nele também fecha o aviso. */
  acao?: Acao;
}

const Ctx = createContext<(texto: string, tipo?: Toast['tipo'], opcoes?: Opcoes) => void>(() => {});
/** Erros ficam mais tempo na tela, porque o usuário precisa ler o que deu errado. */
const DURACAO_PADRAO: Record<Toast['tipo'], number> = { erro: 5000, ok: 3000 };
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fechar = useCallback((id: number) => setToasts((l) => l.filter((t) => t.id !== id)), []);

  const avisar = useCallback(
    (texto: string, tipo: Toast['tipo'] = 'erro', { duracao = DURACAO_PADRAO[tipo], acao }: Opcoes = {}) => {
      const id = ++seq;
      setToasts((l) => [...l, { id, texto, tipo, acao }]);
      setTimeout(() => fechar(id), duracao);
    },
    [fechar],
  );

  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex max-w-[min(360px,calc(100vw-32px))] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex animate-subir items-center justify-between gap-3 rounded-md border border-l-4 border-borda bg-cartao px-3.5 py-2.5 text-sm shadow-lg ${t.tipo === 'ok' ? 'border-l-sucesso' : 'border-l-perigo'}`}
          >
            <span>{t.texto}</span>
            {t.acao && (
              <BotaoIcone
                icone={t.acao.icone}
                rotulo={t.acao.rotulo}
                variante="discreto"
                onClick={() => {
                  t.acao?.aoClicar();
                  fechar(t.id);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx);
