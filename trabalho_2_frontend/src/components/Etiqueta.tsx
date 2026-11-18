import type { ReactNode } from 'react';

export type Tom = 'neutro' | 'alta' | 'media' | 'baixa' | 'atrasada';

const BASE = 'rounded-full border px-2 py-px text-xs font-medium whitespace-nowrap';
const TONS: Record<Tom, string> = {
  neutro: 'border-borda bg-cartao-sub text-suave',
  alta: 'border-perigo bg-transparent text-perigo',
  media: 'border-alerta bg-transparent text-alerta',
  baixa: 'border-sucesso bg-transparent text-sucesso',
  atrasada: 'border-perigo bg-perigo text-sobre-perigo',
};

/** Selo pequeno (prioridade, status, prazo). A cor da prioridade é a mesma usada nos gráficos. */
export default function Etiqueta({ tom = 'neutro', children }: { tom?: Tom; children: ReactNode }) {
  return <span className={`${BASE} ${TONS[tom]}`}>{children}</span>;
}
