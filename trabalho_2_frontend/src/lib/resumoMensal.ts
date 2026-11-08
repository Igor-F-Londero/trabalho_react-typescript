const numero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** "2026-03" -> "março de 2026". Em UTC, porque o prazo é gravado em UTC e não pode escorregar de mês. */
export function formatarMes(mes: string) {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(ano, m - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2026-10" -> "out/26": cabe no rótulo de uma coluna do gráfico. */
export function formatarMesCurto(mes: string) {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES_CURTOS[m - 1]}/${String(ano).slice(-2)}`;
}

/** Se o mês (AAAA-MM) já passou, é o atual ou ainda não começou, pelo calendário local de quem usa. */
export function situacaoDoMes(mes: string, hoje = new Date()): 'passado' | 'atual' | 'futuro' {
  const atual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  if (mes === atual) return 'atual';
  return mes < atual ? 'passado' : 'futuro';
}

export const formatarPercentual = (n: number) => `${numero(n)}%`;
export const formatarMedia = numero;
