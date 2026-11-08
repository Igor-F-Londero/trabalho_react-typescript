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
    return (
      <BotaoIcone icone="lixeira" rotulo={rotulo} className="link perigo" onClick={() => setPedindo(true)} />
    );
  }
  return (
    <span className="linha" role="group" aria-label="Confirmar exclusão">
      <BotaoIcone
        icone="ok"
        rotulo={`Confirmar: ${rotulo}`}
        className="perigo-solido"
        onClick={() => { setPedindo(false); onConfirmar(); }}
        autoFocus
      />
      <BotaoIcone icone="x" rotulo="Cancelar exclusão" className="link" onClick={() => setPedindo(false)} />
    </span>
  );
}
