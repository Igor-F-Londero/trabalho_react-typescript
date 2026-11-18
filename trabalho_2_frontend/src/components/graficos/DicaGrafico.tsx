import type { TooltipContentProps } from 'recharts';

interface Props<Linha> extends Partial<TooltipContentProps> {
  /** Título da dica a partir da linha de dados sob o cursor. */
  titulo: (linha: Linha) => string;
  /** Texto do valor de cada série (ex.: "66,7%"). */
  valor?: (v: number, nome: string) => string;
}

/** Dica que aparece ao passar o mouse (ou tocar) em um gráfico, no mesmo estilo dos cartões do app. */
export default function DicaGrafico<Linha>({ active, payload, titulo, valor = (v) => String(v) }: Props<Linha>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-borda bg-cartao px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold first-letter:uppercase">{titulo(payload[0].payload as Linha)}</p>
      <ul className="space-y-0.5">
        {payload.map((item) => (
          <li key={String(item.dataKey)} className="flex items-center gap-2 text-suave">
            <i className="inline-block size-2.5 rounded-[3px]" style={{ background: item.color ?? (item.payload as { fill?: string })?.fill }} />
            <span>{item.name}</span>
            <b className="ml-auto pl-3 tabular-nums text-texto">{valor(Number(item.value), String(item.name))}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
