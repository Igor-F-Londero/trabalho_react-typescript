interface Item {
  rotulo: string;
  cor: string;
}

/** Legenda em HTML (e não a do Recharts) para ter o mesmo visual nos três gráficos. Decorativa: o gráfico já tem descrição. */
export default function Legenda({ itens }: { itens: Item[] }) {
  return (
    <p aria-hidden="true" className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-suave">
      {itens.map(({ rotulo, cor }) => (
        <span key={rotulo} className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-[3px]" style={{ background: cor }} />
          {rotulo}
        </span>
      ))}
    </p>
  );
}
