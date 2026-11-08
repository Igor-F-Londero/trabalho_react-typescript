import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aplicarTema, salvarTema, temaDoSistema, temaSalvo } from './tema';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.tema;
});
afterEach(() => vi.unstubAllGlobals());

const sistema = (escuro: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: escuro && q.includes('dark'), addEventListener() {}, removeEventListener() {} }));

describe('tema', () => {
  it('sem escolha salva, não há tema salvo', () => {
    expect(temaSalvo()).toBeNull();
  });

  it('lembra o tema escolhido', () => {
    salvarTema('escuro');
    expect(temaSalvo()).toBe('escuro');
    salvarTema('claro');
    expect(temaSalvo()).toBe('claro');
  });

  it('ignora valores inválidos no armazenamento', () => {
    localStorage.setItem('tema', 'roxo');
    expect(temaSalvo()).toBeNull();
  });

  it('aplica o tema no elemento <html> e volta a seguir o sistema com null', () => {
    aplicarTema('escuro');
    expect(document.documentElement.dataset.tema).toBe('escuro');
    aplicarTema('claro');
    expect(document.documentElement.dataset.tema).toBe('claro');
    aplicarTema(null);
    expect(document.documentElement.dataset.tema).toBeUndefined();
  });

  it('o tema do sistema segue prefers-color-scheme', () => {
    sistema(true);
    expect(temaDoSistema()).toBe('escuro');
    sistema(false);
    expect(temaDoSistema()).toBe('claro');
  });

  it('sem suporte a matchMedia, assume o tema claro', () => {
    expect(temaDoSistema()).toBe('claro');
  });
});
