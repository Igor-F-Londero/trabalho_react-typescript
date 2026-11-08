export type NomeIcone =
  | 'pasta' | 'subpasta' | 'pastaSimples' | 'tarefaMais'
  | 'lapis' | 'lixeira' | 'salvar' | 'ok' | 'x' | 'desfazer' | 'recarregar'
  | 'info' | 'tabela' | 'seta' | 'alca' | 'sair' | 'sol' | 'lua';

/**
 * Ícones decorativos (aria-hidden): o significado sempre vem do aria-label do botão.
 * As partes que se movem na animação (tampa, seta, "+"…) têm classe própria; o CSS as anima no hover/foco.
 */
export default function Icone({ nome }: { nome: NomeIcone }) {
  return (
    <svg
      className={`icone icone-${nome}`}
      viewBox="0 0 24 24"
      width="1.15em"
      height="1.15em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {DESENHOS[nome]}
    </svg>
  );
}

const PASTA = 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';

const DESENHOS: Record<NomeIcone, React.ReactNode> = {
  // pasta com "+": criar grupo
  pasta: (
    <>
      <path d={PASTA} />
      <g className="mais"><path d="M12 11v4M10 13h4" /></g>
    </>
  ),
  // pasta com degrau e "+": criar um grupo dentro de outro
  subpasta: (
    <>
      <path d={PASTA} />
      <path d="M7.5 10v3.5A1.5 1.5 0 0 0 9 15h2" />
      <g className="mais"><path d="M15 11.5v4M13 13.5h4" /></g>
    </>
  ),
  pastaSimples: <path d={PASTA} />,
  // caixa de seleção com visto e "+": criar tarefa
  tarefaMais: (
    <>
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" />
      <path d="M8.5 11.5l2.5 2.5 4.5-4.5" />
      <g className="mais"><path d="M19 3v6M16 6h6" /></g>
    </>
  ),
  lapis: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  lixeira: (
    <>
      <g className="tampa">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
      </g>
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 10v6M14 10v6" />
    </>
  ),
  // disquete: salvar
  salvar: (
    <>
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <g className="aba"><path d="M7 3v4a1 1 0 0 0 1 1h7" /></g>
    </>
  ),
  ok: <path className="marca" d="M5 12l5 5L20 7" pathLength={1} />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  // seta curva para trás: desfazer
  desfazer: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ),
  // duas setas em círculo: tentar de novo
  recarregar: (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v5M12 7.5h.01" />
    </>
  ),
  tabela: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 3v18" />
      <g className="linhas"><path d="M3 9h18M3 15h18" /></g>
    </>
  ),
  seta: <path d="M9 6l6 6-6 6" />,
  alca: (
    <>
      <circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" />
    </>
  ),
  // porta com seta saindo
  sair: (
    <>
      <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
      <g className="seta-sair"><path d="M16 8l4 4-4 4M20 12H9" /></g>
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <g className="raios">
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </g>
    </>
  ),
  lua: <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />,
};
