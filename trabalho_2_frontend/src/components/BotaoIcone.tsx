import type { ButtonHTMLAttributes } from 'react';
import Icone, { type NomeIcone } from './Icone';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'title'> {
  icone: NomeIcone;
  /** Descreve exatamente a ação: como o botão não tem texto, vira o nome acessível e a dica ao passar o mouse. */
  rotulo: string;
}

/** Botão que mostra só o ícone da ação; o ícone se anima ao passar o mouse ou receber o foco (ver index.css). */
export default function BotaoIcone({ icone, rotulo, className = '', type = 'button', ...resto }: Props) {
  return (
    <button type={type} className={`icone-so ${className}`.trim()} aria-label={rotulo} title={rotulo} {...resto}>
      <Icone nome={icone} />
    </button>
  );
}
