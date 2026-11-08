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
      className="linha nome-form"
      onKeyDown={(e) => e.key === 'Escape' && onCancelar()}
      onSubmit={(e) => {
        e.preventDefault();
        if (nome.trim()) onSalvar(nome.trim());
      }}
    >
      <input placeholder={rotulo} aria-label={rotulo} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      <BotaoIcone icone="salvar" rotulo="Salvar" type="submit" />
      <BotaoIcone icone="x" rotulo="Cancelar" className="link" onClick={onCancelar} />
    </form>
  );
}
