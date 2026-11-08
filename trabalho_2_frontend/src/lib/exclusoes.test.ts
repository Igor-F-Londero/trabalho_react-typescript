import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adiarExclusao,
  assinarOcultos,
  cancelarPendentes,
  confirmarPendentes,
  idsOcultos,
} from './exclusoes';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cancelarPendentes();
  vi.useRealTimers();
});

describe('exclusões adiadas', () => {
  it('oculta os ids na hora, mas só executa depois da espera', async () => {
    const executar = vi.fn(async () => {});
    adiarExclusao(['a', 'b'], executar, 1000);
    expect([...idsOcultos()].sort()).toEqual(['a', 'b']);
    expect(executar).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(999);
    expect(executar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(executar).toHaveBeenCalledOnce();
    expect(idsOcultos().size).toBe(0);
  });

  it('desfazer cancela a execução e mostra os ids de novo', async () => {
    const executar = vi.fn(async () => {});
    const { desfazer } = adiarExclusao(['a'], executar, 1000);
    desfazer();
    expect(idsOcultos().size).toBe(0);
    await vi.advanceTimersByTimeAsync(5000);
    expect(executar).not.toHaveBeenCalled();
  });

  it('confirmarPendentes executa tudo na hora, uma única vez', async () => {
    const executar = vi.fn(async () => {});
    adiarExclusao(['a'], executar, 1000);
    await confirmarPendentes();
    expect(executar).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(5000);
    expect(executar).toHaveBeenCalledOnce();
  });

  it('mantém o item oculto enquanto a exclusão ainda está em andamento', async () => {
    let terminar = () => {};
    const executar = vi.fn(() => new Promise<void>((r) => (terminar = r)));
    adiarExclusao(['a'], executar, 1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(idsOcultos().has('a')).toBe(true);
    terminar();
    await vi.advanceTimersByTimeAsync(0);
    expect(idsOcultos().has('a')).toBe(false);
  });

  it('desfazer depois que a exclusão já começou não tem efeito', async () => {
    let terminar = () => {};
    const executar = vi.fn(() => new Promise<void>((r) => (terminar = r)));
    const { desfazer } = adiarExclusao(['a'], executar, 1000);
    await vi.advanceTimersByTimeAsync(1000);
    desfazer();
    expect(idsOcultos().has('a')).toBe(true);
    terminar();
  });

  it('avisa os ouvintes quando o conjunto muda, até cancelar a assinatura', () => {
    const ouvinte = vi.fn();
    const cancelar = assinarOcultos(ouvinte);
    const { desfazer } = adiarExclusao(['a'], async () => {}, 1000);
    expect(ouvinte).toHaveBeenCalledTimes(1);
    desfazer();
    expect(ouvinte).toHaveBeenCalledTimes(2);
    cancelar();
    adiarExclusao(['b'], async () => {}, 1000);
    expect(ouvinte).toHaveBeenCalledTimes(2);
  });
});
