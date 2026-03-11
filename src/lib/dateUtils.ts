export function todayStr(): string {
  return new Date().toLocaleDateString('en-CA');
}

/** Convert ISO UTC string to local YYYY-MM-DD date string */
export function toLocalDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-CA');
}

export function formatDateHebrew(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatTime(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'לילה טוב';
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

export function daysAgo(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date(todayStr() + 'T00:00:00');
  return Math.floor((today.getTime() - date.getTime()) / 86400000);
}

export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}
