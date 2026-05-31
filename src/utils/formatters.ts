// Short-scale abbreviations — every symbol unique so magnitudes are never
// ambiguous (descending so the largest matching tier wins).
const SUFFIXES = [
  { value: 1e63, symbol: 'Vg' },
  { value: 1e60, symbol: 'Nd' },
  { value: 1e57, symbol: 'Od' },
  { value: 1e54, symbol: 'St' },
  { value: 1e51, symbol: 'Sd' },
  { value: 1e48, symbol: 'Qq' },
  { value: 1e45, symbol: 'Qd' },
  { value: 1e42, symbol: 'Td' },
  { value: 1e39, symbol: 'Dd' },
  { value: 1e36, symbol: 'Ud' },
  { value: 1e33, symbol: 'Dc' },
  { value: 1e30, symbol: 'No' },
  { value: 1e27, symbol: 'Oc' },
  { value: 1e24, symbol: 'Sp' },
  { value: 1e21, symbol: 'Sx' },
  { value: 1e18, symbol: 'Qi' },
  { value: 1e15, symbol: 'Qa' },
  { value: 1e12, symbol: 'T' },
  { value: 1e9, symbol: 'B' },
  { value: 1e6, symbol: 'M' },
  { value: 1e3, symbol: 'K' },
];

export function formatMoney(amount: number, showSign = false): string {
  if (!isFinite(amount)) return '$0';
  const sign = showSign && amount > 0 ? '+' : '';

  for (const suffix of SUFFIXES) {
    if (Math.abs(amount) >= suffix.value) {
      const val = amount / suffix.value;
      const formatted = val >= 100 ? val.toFixed(1) : val >= 10 ? val.toFixed(2) : val.toFixed(3);
      return `${sign}$${formatted}${suffix.symbol}`;
    }
  }

  if (Math.abs(amount) >= 1) {
    return `${sign}$${amount.toFixed(2)}`;
  }
  return `${sign}$${amount.toFixed(4)}`;
}

export function formatNumber(amount: number): string {
  if (!isFinite(amount)) return '0';
  for (const suffix of SUFFIXES) {
    if (Math.abs(amount) >= suffix.value) {
      const val = amount / suffix.value;
      const formatted = val >= 100 ? val.toFixed(1) : val >= 10 ? val.toFixed(2) : val.toFixed(3);
      return `${formatted}${suffix.symbol}`;
    }
  }
  return amount.toFixed(2);
}

export function formatIncomePerSec(amount: number): string {
  return `${formatMoney(amount)}/s`;
}

export function formatPercent(decimal: number, decimals = 2): string {
  const val = (decimal * 100).toFixed(decimals);
  return `${decimal >= 0 ? '+' : ''}${val}%`;
}

export function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m ${secs % 60}s`;
  return `${secs}s`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

export function getMultiplierText(mult: number): string {
  return `${mult.toFixed(2)}x`;
}
