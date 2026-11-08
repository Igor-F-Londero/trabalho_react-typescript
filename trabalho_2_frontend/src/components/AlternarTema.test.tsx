import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlternarTema from './AlternarTema';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.tema;
});
afterEach(() => vi.unstubAllGlobals());

/** Simula o `prefers-color-scheme` e devolve uma função para o sistema mudar de tema. */
function sistema(escuro: boolean) {
  let ouvinte = () => {};
  const mq = {
    matches: escuro,
    addEventListener: (_: string, fn: () => void) => (ouvinte = fn),
    removeEventListener: () => {},
  };
  vi.stubGlobal('matchMedia', () => mq);
  return (novoEscuro: boolean) => {
    mq.matches = novoEscuro;
    ouvinte();
  };
}

describe('AlternarTema', () => {
  it('no tema claro, oferece mudar para o escuro', () => {
    render(<AlternarTema />);
    expect(screen.getByRole('button', { name: 'Mudar para o tema escuro' })).toBeInTheDocument();
  });

  it('clicar troca o tema, salva a escolha e aplica no <html>', async () => {
    render(<AlternarTema />);
    await userEvent.click(screen.getByRole('button', { name: 'Mudar para o tema escuro' }));
    expect(document.documentElement.dataset.tema).toBe('escuro');
    expect(localStorage.getItem('tema')).toBe('escuro');
    await userEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }));
    expect(document.documentElement.dataset.tema).toBe('claro');
    expect(localStorage.getItem('tema')).toBe('claro');
  });

  it('respeita a escolha salva em vez do sistema', () => {
    sistema(false);
    localStorage.setItem('tema', 'escuro');
    render(<AlternarTema />);
    expect(screen.getByRole('button', { name: 'Mudar para o tema claro' })).toBeInTheDocument();
  });

  it('sem escolha salva, segue o sistema', () => {
    sistema(true);
    render(<AlternarTema />);
    expect(screen.getByRole('button', { name: 'Mudar para o tema claro' })).toBeInTheDocument();
  });

  it('sem escolha salva, acompanha o sistema quando ele muda', () => {
    const mudarSistema = sistema(false);
    render(<AlternarTema />);
    expect(screen.getByRole('button', { name: 'Mudar para o tema escuro' })).toBeInTheDocument();
    act(() => mudarSistema(true));
    expect(screen.getByRole('button', { name: 'Mudar para o tema claro' })).toBeInTheDocument();
  });

  it('quem estava com o sistema escuro consegue ir para o claro (o caso de quem pediu o modo claro)', async () => {
    sistema(true);
    render(<AlternarTema />);
    await userEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }));
    expect(document.documentElement.dataset.tema).toBe('claro');
  });
});
