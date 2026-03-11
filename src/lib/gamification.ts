import type { CigaretteEntry, BadgeContext, UserProfile, AchievementState } from '../types';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { getAllDailyStats, overallAverage } from './analytics';
import { todayStr, toLocalDate } from './dateUtils';

// Calculate points for completing a cigarette entry
export function calcEntryPoints(
  entry: CigaretteEntry,
  todayCount: number
): { total: number; breakdown: { reason: string; points: number }[] } {
  const breakdown: { reason: string; points: number }[] = [];

  // Base points for logging
  breakdown.push({ reason: 'רישום', points: 5 });

  // First of day bonus
  if (todayCount === 1) {
    breakdown.push({ reason: 'עקביות יומית', points: 3 });
  }

  // Awareness bonus: big gap between craving and enjoyment
  if (entry.enjoyment !== null && entry.craving - entry.enjoyment >= 3) {
    breakdown.push({ reason: 'מודעות — פער גדול', points: 5 });
  }

  const total = breakdown.reduce((s, b) => s + b.points, 0);
  return { total, breakdown };
}

// Calculate end-of-day bonus points
export function calcDayEndPoints(
  todayCount: number,
  yesterdayCount: number | null,
  baseline: number,
  streakDays: number
): { total: number; breakdown: { reason: string; points: number }[] } {
  const breakdown: { reason: string; points: number }[] = [];

  if (todayCount < baseline) {
    breakdown.push({ reason: 'מתחת ל-baseline', points: 20 });
  }

  if (yesterdayCount !== null && todayCount < yesterdayCount) {
    breakdown.push({ reason: 'שיפור מאתמול', points: 15 });
  }

  if (streakDays > 0) {
    breakdown.push({ reason: `רצף ${streakDays} ימים`, points: 10 * streakDays });
  }

  const total = breakdown.reduce((s, b) => s + b.points, 0);
  return { total, breakdown };
}

// Calculate streak
export function calculateStreak(entries: CigaretteEntry[]): number {
  const dailyStats = getAllDailyStats(entries);
  const today = todayStr();
  const avg = overallAverage(entries);

  // Look backwards from yesterday
  let streak = 0;
  for (let i = dailyStats.length - 1; i >= 0; i--) {
    const day = dailyStats[i];
    if (day.date === today) continue; // skip today (incomplete)
    if (day.count < avg || (i > 0 && day.count < dailyStats[i - 1].count)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Evaluate all badges and return newly unlocked ones
export function evaluateBadges(
  entries: CigaretteEntry[],
  profile: UserProfile,
  achievements: AchievementState
): string[] {
  const today = todayStr();
  const todayEntries = entries.filter((e) => toLocalDate(e.startedAt) === today);
  const dailyStats = getAllDailyStats(entries);
  const dates = new Set(entries.map((e) => toLocalDate(e.startedAt)));

  const ctx: BadgeContext = {
    entries,
    profile,
    achievements,
    todayEntries,
    daysTracked: dates.size,
    dailyStats,
  };

  const alreadyUnlocked = new Set(achievements.unlockedBadges.map((b) => b.badgeId));
  const newlyUnlocked: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (alreadyUnlocked.has(badge.id)) continue;
    try {
      if (badge.evaluate(ctx)) {
        newlyUnlocked.push(badge.id);
      }
    } catch {
      // skip failing badge evaluations
    }
  }

  return newlyUnlocked;
}
