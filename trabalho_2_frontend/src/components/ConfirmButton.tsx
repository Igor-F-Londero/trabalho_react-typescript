import { useState } from 'react';
import BotaoIcone from './BotaoIcone';

interface Props {
  onConfirmar: () => void;
  /** Nome acessível do botão (ex.: "Excluir Faculdade"); o botão mostra só o ícone. */
  rotulo: string;
}

export default function ConfirmButton({ onConfirmar, rotulo }: Props) {
  const [pedindo, setPedindo] = useState(false);

  if (!pedindo) {
    return <BotaoIcone icone="lixeira" rotulo={rotulo} variante="perigo" onClick={() => setPedindo(true)} />;
  }
  return (
    <span className="flex items-center gap-1.5" role="group" aria-label="Confirmar exclusão">
      <BotaoIcone
        icone="ok"
        rotulo={`Confirmar: ${rotulo}`}
        variante="perigo-solido"
        onClick={() => { setPedindo(false); onConfirmar(); }}
        autoFocus
      />
      <BotaoIcone icone="x" rotulo="Cancelar exclusão" variante="discreto" onClick={() => setPedindo(false)} />
    </span>
  );
}
