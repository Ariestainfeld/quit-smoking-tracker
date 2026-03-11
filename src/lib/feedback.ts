import type { CigaretteEntry, FeedbackMessage, SmokingReason, UserProfile } from '../types';
import { paceComparison, reasonAnalysis } from './analytics';
import { todayStr, toLocalDate } from './dateUtils';

export function generatePreSmokeFeedback(
  entries: CigaretteEntry[],
  profile: UserProfile,
  currentReason: SmokingReason | null,
  streakDays: number
): FeedbackMessage {
  const messages: FeedbackMessage[] = [];
  const today = todayStr();
  const todayEntries = entries.filter((e) => toLocalDate(e.startedAt) === today);
  const todayCount = todayEntries.length;

  // Pace-based
  if (entries.length > 5) {
    const pace = paceComparison(entries);
    if (pace.isAbove && pace.diff >= 3) {
      messages.push({
        priority: 'critical',
        text: `שים לב — עד השעה הזו בדר"כ עישנת ${pace.historicalAvgAtThisHour}, היום כבר ${pace.todayCount}`,
        emoji: '⚠️',
      });
    } else if (pace.isAbove && pace.diff >= 1) {
      messages.push({
        priority: 'insight',
        text: `קצת מעל הממוצע היום (${pace.todayCount} לעומת ${pace.historicalAvgAtThisHour} בדר"כ)`,
        emoji: '📊',
      });
    } else if (!pace.isAbove && pace.todayCount > 0) {
      messages.push({
        priority: 'encouragement',
        text: 'כל הכבוד! היום אתה מתחת לממוצע — המשך כך',
        emoji: '💪',
      });
    }
  }

  // Baseline proximity
  if (profile.baseline > 0 && todayCount >= profile.baseline - 2 && todayCount < profile.baseline) {
    messages.push({
      priority: 'critical',
      text: `עוד ${profile.baseline - todayCount} ואתה מגיע ל-baseline שלך — בוא ננסה לא`,
      emoji: '🎯',
    });
  }

  // Pattern-based for current reason
  if (currentReason && currentReason !== 'אחר') {
    const reasonEntries = entries.filter(
      (e) => e.reason === currentReason && e.enjoyment !== null
    );
    if (reasonEntries.length >= 5) {
      const avgEnj =
        reasonEntries.reduce((s, e) => s + e.enjoyment!, 0) / reasonEntries.length;
      if (avgEnj <= 2) {
        messages.push({
          priority: 'insight',
          text: `ב-${reasonEntries.length} הפעמים האחרונות ש"${currentReason}" — ההנאה הממוצעת שלך הייתה רק ${avgEnj.toFixed(1)}`,
          emoji: '💡',
        });
      }
    }
  }

  // Overall reason insights
  if (entries.filter((e) => e.enjoyment !== null).length >= 10) {
    const analysis = reasonAnalysis(entries);
    const worstReason = analysis.find((r) => r.gapScore >= 2.5);
    if (worstReason && worstReason.reason !== currentReason) {
      messages.push({
        priority: 'insight',
        text: `כש"${worstReason.reason}" — חושק ${worstReason.avgCraving} אבל נהנה רק ${worstReason.avgEnjoyment}... שווה לחשוב על חלופה`,
        emoji: '🤔',
      });
    }
  }

  // Time-based
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) {
    messages.push({
      priority: 'neutral',
      text: 'סיגריה באמצע הלילה? בדרך כלל זו לא הנאה אמיתית',
      emoji: '🌙',
    });
  }

  // Streak
  if (streakDays >= 3) {
    messages.push({
      priority: 'encouragement',
      text: `אתה ברצף של ${streakDays} ימים של שיפור! אל תשבור`,
      emoji: '🔥',
    });
  }

  // First of day
  if (todayCount === 0) {
    messages.push({
      priority: 'neutral',
      text: 'סיגריה ראשונה היום — בוא נעשה את היום הזה טוב',
      emoji: '🌅',
    });
  }

  // Pick best message by priority
  const priorityOrder = { critical: 0, insight: 1, encouragement: 2, neutral: 3 };
  messages.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    messages[0] || {
      priority: 'neutral',
      text: `סיגריה מספר ${todayCount + 1} היום`,
      emoji: '🚬',
    }
  );
}

export function generatePostSmokeFeedback(
  craving: number,
  enjoyment: number
): FeedbackMessage | null {
  const gap = craving - enjoyment;

  if (gap >= 3) {
    return {
      priority: 'insight',
      text: `חשקת ב-${craving} ונהנית רק ${enjoyment} — הסיגריה הזו לא הייתה שווה. בפעם הבאה, תן לחשק לעבור`,
      emoji: '🪞',
    };
  }

  if (gap >= 2) {
    return {
      priority: 'insight',
      text: 'ההנאה הייתה פחות ממה שציפית — שים לב לדפוס הזה',
      emoji: '📉',
    };
  }

  if (enjoyment <= 1) {
    return {
      priority: 'insight',
      text: 'הנאה 1 מתוך 5? למה בכלל הדלקת?',
      emoji: '🤷',
    };
  }

  if (enjoyment >= craving) {
    return {
      priority: 'encouragement',
      text: 'נהנית — ותכננת מראש. שליטה טובה',
      emoji: '👍',
    };
  }

  return null;
}
