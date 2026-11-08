import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Icone, { type NomeIcone } from './Icone';

const NOMES: NomeIcone[] = [
  'pasta', 'subpasta', 'pastaSimples', 'tarefaMais', 'lapis', 'lixeira', 'salvar', 'ok', 'x',
  'desfazer', 'recarregar', 'info', 'tabela', 'seta', 'alca', 'sair', 'sol', 'lua',
];

const desenhar = (nome: NomeIcone) => render(<Icone nome={nome} />).container.querySelector('svg')!;

describe('Icone', () => {
  it.each(NOMES)('desenha o ícone "%s" como decoração (o botão é que tem o nome acessível)', (nome) => {
    const svg = desenhar(nome);
    expect(svg).toHaveClass('icone', `icone-${nome}`);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.childElementCount).toBeGreaterThan(0);
  });

  // O CSS anima só a parte que se mexe (a tampa da lixeira, a seta da porta…), então ela precisa de uma classe.
  it.each([
    ['lixeira', 'tampa'],
    ['sair', 'seta-sair'],
    ['pasta', 'mais'],
    ['subpasta', 'mais'],
    ['tarefaMais', 'mais'],
    ['ok', 'marca'],
    ['salvar', 'aba'],
  ] as const)('o ícone "%s" expõe a parte animada ".%s"', (nome, parte) => {
    expect(desenhar(nome).querySelector(`.${parte}`)).toBeInTheDocument();
  });
});
