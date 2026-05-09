export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency = 'SYP'): string {
  return new Intl.NumberFormat('ar-SY', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ar-SY').format(n);
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat('ar-SY', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(d));
}

export function formatRelative(d: string | Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)   return 'الآن';
  if (minutes < 60)  return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)    return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

export function pct(a: number, b: number): string {
  if (!b) return '0%';
  return `${((a / b) * 100).toFixed(1)}%`;
}
