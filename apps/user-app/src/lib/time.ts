export function formatTime12h(time24: string): string {
  if (!time24) return time24;
  const [hRaw, mRaw = '00'] = time24.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;

  const period = h < 12 ? 'ص' : 'م';
  const h12 = h % 12 || 12;
  const mm = String(m).padStart(2, '0');
  return `${h12}:${mm} ${period}`;
}

export function formatTimeRange(start: string, end?: string): string {
  if (!end) return formatTime12h(start);
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}
