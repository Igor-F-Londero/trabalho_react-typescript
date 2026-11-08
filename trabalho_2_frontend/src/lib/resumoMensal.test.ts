import { describe, expect, it } from 'vitest';
import { formatarMes, formatarMesCurto, formatarPercentual, situacaoDoMes } from './resumoMensal';

describe('resumoMensal', () => {
  it('formata o mês por extenso em português, sem escorregar por fuso', () => {
    expect(formatarMes('2026-03')).toBe('março de 2026');
    expect(formatarMes('2026-01')).toBe('janeiro de 2026');
    expect(formatarMes('2025-12')).toBe('dezembro de 2025');
  });

  it('formata percentuais com vírgula e sem casas inúteis', () => {
    expect(formatarPercentual(55.6)).toBe('55,6%');
    expect(formatarPercentual(50)).toBe('50%');
    expect(formatarPercentual(0)).toBe('0%');
    expect(formatarPercentual(100)).toBe('100%');
  });

  it('diz se o mês já passou, é o atual ou ainda não começou (pelo calendário local)', () => {
    const hoje = new Date(2026, 9, 31, 23, 59); // 31/10/2026 à noite
    expect(situacaoDoMes('2026-09', hoje)).toBe('passado');
    expect(situacaoDoMes('2026-10', hoje)).toBe('atual');
    expect(situacaoDoMes('2026-11', hoje)).toBe('futuro');
  });

  it('compara corretamente na virada de ano', () => {
    const hoje = new Date(2026, 11, 31);
    expect(situacaoDoMes('2026-12', hoje)).toBe('atual');
    expect(situacaoDoMes('2027-01', hoje)).toBe('futuro');
    expect(situacaoDoMes('2025-12', hoje)).toBe('passado');
  });

  it('abrevia o mês para os rótulos do gráfico', () => {
    expect(formatarMesCurto('2026-10')).toBe('out/26');
    expect(formatarMesCurto('2026-01')).toBe('jan/26');
    expect(formatarMesCurto('2027-12')).toBe('dez/27');
  });
});
