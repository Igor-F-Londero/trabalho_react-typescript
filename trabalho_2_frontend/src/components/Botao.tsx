import type { ButtonHTMLAttributes } from 'react';
import { classesDoBotao, type Variante } from './estiloBotao';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

/** Botão com texto (usado onde o texto é o próprio rótulo, como no formulário de login). */
export default function Botao({ variante = 'primario', className = '', type = 'button', ...resto }: Props) {
  return <button type={type} className={classesDoBotao(variante, className)} {...resto} />;
}
