import { useState } from 'react';
import BotaoIcone from './BotaoIcone';

interface Props {
  rotulo: string;
  inicial?: string;
  onSalvar: (nome: string) => void;
  onCancelar: () => void;
}

export default function NomeForm({ rotulo, inicial = '', onSalvar, onCancelar }: Props) {
  const [nome, setNome] = useState(inicial);

  return (
    <form
      className="my-1.5 flex flex-wrap items-center gap-1.5 [&>button]:animate-pop [&>button:nth-of-type(2)]:[animation-delay:.06s]"
      onKeyDown={(e) => e.key === 'Escape' && onCancelar()}
      onSubmit={(e) => {
        e.preventDefault();
        if (nome.trim()) onSalvar(nome.trim());
      }}
    >
      <input
        className="min-w-0 flex-[1_1_180px]"
        placeholder={rotulo}
        aria-label={rotulo}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoFocus
      />
      <BotaoIcone icone="salvar" rotulo="Salvar" type="submit" />
      <BotaoIcone icone="x" rotulo="Cancelar" variante="discreto" onClick={onCancelar} />
    </form>
  );
}
