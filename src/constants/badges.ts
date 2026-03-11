import type { BadgeDefinition, BadgeContext, DailyStats } from '../types';
import { toLocalDate } from '../lib/dateUtils';

function completedDays(ctx: BadgeContext): DailyStats[] {
  const today = new Date().toLocaleDateString('en-CA');
  return ctx.dailyStats.filter(d => d.date !== today);
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // --- Milestones ---
  {
    id: 'first-day',
    name: 'יום ראשון',
    description: 'התחלת לעקוב — צעד ראשון לשינוי!',
    emoji: '🌟',
    category: 'milestone',
    evaluate: (ctx) => ctx.daysTracked >= 1,
  },
  {
    id: 'one-week',
    name: 'שבוע שלם',
    description: 'שבוע של מעקב — אתה רציני!',
    emoji: '📅',
    category: 'milestone',
    evaluate: (ctx) => ctx.daysTracked >= 7,
  },
  {
    id: 'one-month',
    name: 'חודש של מודעות',
    description: '30 ימים של מעקב — מדהים!',
    emoji: '🗓️',
    category: 'milestone',
    evaluate: (ctx) => ctx.daysTracked >= 30,
  },
  {
    id: 'logger-100',
    name: 'מאה רישומים',
    description: 'רשמת 100 סיגריות — מודעות היא הצעד הראשון',
    emoji: '📝',
    category: 'milestone',
    evaluate: (ctx) => ctx.entries.filter(e => e.finishedAt).length >= 100,
  },

  // --- Reduction ---
  {
    id: 'under-10',
    name: 'מתחת ל-10',
    description: 'יום ראשון עם פחות מ-10 סיגריות',
    emoji: '🎯',
    category: 'reduction',
    evaluate: (ctx) => completedDays(ctx).some(d => d.count < 10 && d.count > 0),
  },
  {
    id: 'half-baseline',
    name: 'חצי מהרגיל',
    description: 'יום עם חצי מכמות הבסיס שלך',
    emoji: '✂️',
    category: 'reduction',
    evaluate: (ctx) =>
      completedDays(ctx).some(d => d.count > 0 && d.count <= ctx.profile.baseline / 2),
  },
  {
    id: 'single-digits',
    name: 'ספרה אחת',
    description: 'יום עם פחות מ-5 סיגריות',
    emoji: '🤏',
    category: 'reduction',
    evaluate: (ctx) => completedDays(ctx).some(d => d.count > 0 && d.count < 5),
  },

  // --- Consistency ---
  {
    id: 'streak-3',
    name: 'רצף של 3',
    description: '3 ימים רצופים מתחת לממוצע',
    emoji: '🔥',
    category: 'consistency',
    evaluate: (ctx) => ctx.achievements.longestStreak >= 3,
  },
  {
    id: 'week-improvement',
    name: 'שבוע של שיפור',
    description: '7 ימים רצופים מתחת לממוצע',
    emoji: '📉',
    category: 'consistency',
    evaluate: (ctx) => ctx.achievements.longestStreak >= 7,
  },
  {
    id: 'streak-14',
    name: 'שבועיים ברצף',
    description: '14 ימים רצופים מתחת לממוצע',
    emoji: '⚡',
    category: 'consistency',
    evaluate: (ctx) => ctx.achievements.longestStreak >= 14,
  },

  // --- Awareness ---
  {
    id: 'high-awareness',
    name: 'מודעות גבוהה',
    description: 'יום שבו 80%+ מהסיגריות קיבלו הנאה נמוכה מהחשק',
    emoji: '🧠',
    category: 'awareness',
    evaluate: (ctx) => {
      return completedDays(ctx).some(d => {
        const dayEntries = ctx.entries.filter(
          e => toLocalDate(e.startedAt) === d.date && e.enjoyment !== null
        );
        if (dayEntries.length < 3) return false;
        const lowEnjoy = dayEntries.filter(e => e.enjoyment! < e.craving);
        return lowEnjoy.length / dayEntries.length >= 0.8;
      });
    },
  },
  {
    id: 'reality-check',
    name: 'בדיקת מציאות',
    description: 'דירגת הנאה 1 לסיגריה עם חשק 5 — המוח רימה אותך',
    emoji: '🪞',
    category: 'awareness',
    evaluate: (ctx) =>
      ctx.entries.some(e => e.craving === 5 && e.enjoyment === 1),
  },
  {
    id: 'pattern-breaker',
    name: 'שובר דפוסים',
    description: 'הסיבה הכי שכיחה שלך ירדה ב-50% השבוע',
    emoji: '💥',
    category: 'awareness',
    evaluate: (ctx) => {
      if (ctx.dailyStats.length < 14) return false;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toLocaleDateString('en-CA');
      const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toLocaleDateString('en-CA');

      const thisWeekEntries = ctx.entries.filter(e => toLocalDate(e.startedAt) >= weekAgo);
      const lastWeekEntries = ctx.entries.filter(
        e => toLocalDate(e.startedAt) >= twoWeeksAgo && toLocalDate(e.startedAt) < weekAgo
      );

      if (lastWeekEntries.length < 5) return false;

      // Find top reason last week
      const reasonCounts: Record<string, number> = {};
      lastWeekEntries.forEach(e => {
        reasonCounts[e.reason] = (reasonCounts[e.reason] || 0) + 1;
      });
      const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
      if (!topReason) return false;

      const thisWeekCount = thisWeekEntries.filter(e => e.reason === topReason[0]).length;
      return thisWeekCount <= topReason[1] * 0.5;
    },
  },

  // --- Special ---
  {
    id: 'night-owl',
    name: 'ינשוף',
    description: 'עישנת אחרי חצות ודירגת הנאה 1 — למה בכלל?',
    emoji: '🦉',
    category: 'special',
    evaluate: (ctx) =>
      ctx.entries.some(e => {
        const hour = new Date(e.startedAt).getHours();
        return hour >= 0 && hour < 5 && e.enjoyment === 1;
      }),
  },
  {
    id: 'coffee-awareness',
    name: 'קפה ≠ סיגריה',
    description: '5+ סיגריות עם קפה וברובן הנאה נמוכה',
    emoji: '☕',
    category: 'special',
    evaluate: (ctx) => {
      const coffeeEntries = ctx.entries.filter(
        e => e.reason === 'קפה' && e.enjoyment !== null
      );
      if (coffeeEntries.length < 5) return false;
      const lowEnjoy = coffeeEntries.filter(e => e.enjoyment! <= 2);
      return lowEnjoy.length / coffeeEntries.length >= 0.7;
    },
  },
];
