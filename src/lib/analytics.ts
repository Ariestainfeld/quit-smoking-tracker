import type {
  CigaretteEntry,
  DailyStats,
  HourlyDistribution,
  ReasonAnalysis,
  PaceComparison,
  SmokingReason,
} from '../types';
import { todayStr, toLocalDate } from './dateUtils';

// Group entries by date
export function groupByDate(entries: CigaretteEntry[]): Map<string, CigaretteEntry[]> {
  const map = new Map<string, CigaretteEntry[]>();
  for (const e of entries) {
    const date = toLocalDate(e.startedAt);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(e);
  }
  return map;
}

// Daily stats for a single date
export function getDailyStats(entries: CigaretteEntry[]): DailyStats & { entries: CigaretteEntry[] } {
  if (entries.length === 0) {
    return {
      date: '',
      count: 0,
      avgCraving: 0,
      avgEnjoyment: 0,
      reasons: {},
      unnecessaryCount: 0,
      entries: [],
    };
  }

  const date = toLocalDate(entries[0].startedAt);
  const finished = entries.filter((e) => e.enjoyment !== null);

  const avgCraving = entries.reduce((s, e) => s + e.craving, 0) / entries.length;
  const avgEnjoyment =
    finished.length > 0 ? finished.reduce((s, e) => s + e.enjoyment!, 0) / finished.length : 0;

  const reasons: Partial<Record<SmokingReason, number>> = {};
  entries.forEach((e) => {
    reasons[e.reason] = (reasons[e.reason] || 0) + 1;
  });

  const unnecessaryCount = finished.filter((e) => e.enjoyment! < e.craving - 1).length;

  return { date, count: entries.length, avgCraving, avgEnjoyment, reasons, unnecessaryCount, entries };
}

// All daily stats sorted chronologically
export function getAllDailyStats(entries: CigaretteEntry[]): DailyStats[] {
  const grouped = groupByDate(entries);
  const stats: DailyStats[] = [];
  for (const [, dayEntries] of grouped) {
    stats.push(getDailyStats(dayEntries));
  }
  return stats.sort((a, b) => a.date.localeCompare(b.date));
}

// Overall average per day
export function overallAverage(entries: CigaretteEntry[]): number {
  const grouped = groupByDate(entries);
  if (grouped.size === 0) return 0;
  let total = 0;
  for (const [, dayEntries] of grouped) {
    total += dayEntries.length;
  }
  return total / grouped.size;
}

// Rolling N-day average
export function rollingAverage(entries: CigaretteEntry[], days: number): number {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 86400000).toLocaleDateString('en-CA');
  const recent = entries.filter((e) => toLocalDate(e.startedAt) >= cutoff);
  const grouped = groupByDate(recent);
  if (grouped.size === 0) return 0;
  let total = 0;
  for (const [, dayEntries] of grouped) {
    total += dayEntries.length;
  }
  return total / Math.min(days, grouped.size);
}

// Pace comparison: today vs historical average at this hour
export function paceComparison(entries: CigaretteEntry[]): PaceComparison {
  const today = todayStr();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayEntries = entries.filter((e) => toLocalDate(e.startedAt) === today);
  const todayCount = todayEntries.length;

  // Historical: for each past day, count entries before current time
  const grouped = groupByDate(entries);
  const pastDayCounts: number[] = [];

  for (const [date, dayEntries] of grouped) {
    if (date === today) continue;
    const beforeNow = dayEntries.filter((e) => {
      const d = new Date(e.startedAt);
      return d.getHours() * 60 + d.getMinutes() <= currentMinutes;
    });
    pastDayCounts.push(beforeNow.length);
  }

  const historicalAvgAtThisHour =
    pastDayCounts.length > 0
      ? pastDayCounts.reduce((s, c) => s + c, 0) / pastDayCounts.length
      : 0;

  return {
    todayCount,
    historicalAvgAtThisHour: Math.round(historicalAvgAtThisHour * 10) / 10,
    isAbove: todayCount > historicalAvgAtThisHour,
    diff: Math.round((todayCount - historicalAvgAtThisHour) * 10) / 10,
  };
}

// Reason analysis
export function reasonAnalysis(entries: CigaretteEntry[]): ReasonAnalysis[] {
  const finished = entries.filter((e) => e.enjoyment !== null);
  const byReason = new Map<SmokingReason, CigaretteEntry[]>();

  for (const e of finished) {
    if (!byReason.has(e.reason)) byReason.set(e.reason, []);
    byReason.get(e.reason)!.push(e);
  }

  const result: ReasonAnalysis[] = [];
  for (const [reason, re] of byReason) {
    const avgCraving = re.reduce((s, e) => s + e.craving, 0) / re.length;
    const avgEnjoyment = re.reduce((s, e) => s + e.enjoyment!, 0) / re.length;
    result.push({
      reason,
      count: re.length,
      avgCraving: Math.round(avgCraving * 10) / 10,
      avgEnjoyment: Math.round(avgEnjoyment * 10) / 10,
      gapScore: Math.round((avgCraving - avgEnjoyment) * 10) / 10,
    });
  }

  return result.sort((a, b) => b.gapScore - a.gapScore);
}

// Unnecessary percentage
export function unnecessaryPercentage(entries: CigaretteEntry[]): number {
  const finished = entries.filter((e) => e.enjoyment !== null);
  if (finished.length === 0) return 0;
  const unnecessary = finished.filter((e) => e.enjoyment! < e.craving - 1);
  return Math.round((unnecessary.length / finished.length) * 100);
}

// Hourly distribution
export function hourlyDistribution(entries: CigaretteEntry[]): HourlyDistribution[] {
  const counts = new Array(24).fill(0);
  entries.forEach((e) => {
    const hour = new Date(e.startedAt).getHours();
    counts[hour]++;
  });
  return counts.map((count, hour) => ({ hour, count }));
}

// Weekly comparison
export function weeklyComparison(entries: CigaretteEntry[]) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toLocaleDateString('en-CA');
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toLocaleDateString('en-CA');

  const thisWeek = entries.filter((e) => toLocalDate(e.startedAt) >= weekAgo);
  const lastWeek = entries.filter(
    (e) => toLocalDate(e.startedAt) >= twoWeeksAgo && toLocalDate(e.startedAt) < weekAgo
  );

  const calc = (arr: CigaretteEntry[]) => {
    const finished = arr.filter((e) => e.enjoyment !== null);
    return {
      count: arr.length,
      avgCraving: arr.length > 0 ? arr.reduce((s, e) => s + e.craving, 0) / arr.length : 0,
      avgEnjoyment:
        finished.length > 0 ? finished.reduce((s, e) => s + e.enjoyment!, 0) / finished.length : 0,
    };
  };

  const tw = calc(thisWeek);
  const lw = calc(lastWeek);

  return {
    thisWeek: tw,
    lastWeek: lw,
    countChange: lw.count > 0 ? Math.round(((tw.count - lw.count) / lw.count) * 100) : 0,
  };
}

// Best and worst day
export function bestAndWorstDay(dailyStats: DailyStats[]) {
  const completed = dailyStats.filter((d) => d.date !== todayStr() && d.count > 0);
  if (completed.length === 0) return { best: null, worst: null };
  const sorted = [...completed].sort((a, b) => a.count - b.count);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

// Trend direction
export function trendDirection(
  dailyStats: DailyStats[]
): 'improving' | 'stable' | 'worsening' {
  if (dailyStats.length < 7) return 'stable';
  const recent7 = dailyStats.slice(-7);
  const prev7 = dailyStats.slice(-14, -7);
  if (prev7.length === 0) return 'stable';

  const recentAvg = recent7.reduce((s, d) => s + d.count, 0) / recent7.length;
  const prevAvg = prev7.reduce((s, d) => s + d.count, 0) / prev7.length;

  const diff = recentAvg - prevAvg;
  if (diff < -0.5) return 'improving';
  if (diff > 0.5) return 'worsening';
  return 'stable';
}
