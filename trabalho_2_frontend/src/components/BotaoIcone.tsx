import type { ButtonHTMLAttributes } from 'react';
import { classesDoBotao, type Variante } from './estiloBotao';
import Icone, { type NomeIcone } from './Icone';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'title'> {
  icone: NomeIcone;
  /** Descreve exatamente a ação: como o botão não tem texto, vira o nome acessível e a dica ao passar o mouse. */
  rotulo: string;
  variante?: Variante;
  /** Botão redondo e maior, para a ação principal de uma tela vazia. */
  grande?: boolean;
}

/** Botão que mostra só o ícone da ação; o ícone se anima ao passar o mouse ou receber o foco (ver index.css). */
export default function BotaoIcone({ icone, rotulo, variante = 'primario', grande = false, className = '', type = 'button', ...resto }: Props) {
  return (
    <button
      type={type}
      className={classesDoBotao(
        variante,
        `${grande ? 'size-[52px] min-h-[52px] rounded-full [&_.icone]:size-[1.6rem]' : 'w-[38px] [&_.icone]:size-[1.3rem]'} px-0 ${className}`,
      )}
      aria-label={rotulo}
      title={rotulo}
      {...resto}
    >
      <Icone nome={icone} />
    </button>
  );
}
