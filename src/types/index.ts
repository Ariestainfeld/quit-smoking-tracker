// ===== Core Data Types =====

export type SmokingReason =
  | 'קפה'
  | 'אחרי אוכל'
  | 'צריך להתרכז'
  | 'עצבני/לא רגוע'
  | 'עם חברים'
  | 'רגע של הפסקה'
  | 'אחר';

export interface CigaretteEntry {
  id: string;
  startedAt: string;       // ISO timestamp
  finishedAt: string | null;
  craving: number;         // 1-5
  reason: SmokingReason;
  reasonCustom?: string;
  enjoyment: number | null; // 1-5
  autoFinished?: boolean;  // true if auto-closed after timeout
  retroactive?: boolean;   // true if logged after the fact
}

export interface UserProfile {
  name: string;
  baseline: number;        // estimated daily count at start
  createdAt: string;       // ISO date
}

// ===== Gamification =====

export interface AchievementState {
  points: number;
  level: number;
  unlockedBadges: UnlockedBadge[];
  streakDays: number;
  longestStreak: number;
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
  seen: boolean;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'milestone' | 'awareness' | 'reduction' | 'consistency' | 'special';
  evaluate: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  entries: CigaretteEntry[];
  profile: UserProfile;
  achievements: AchievementState;
  todayEntries: CigaretteEntry[];
  daysTracked: number;
  dailyStats: DailyStats[];
}

export interface LevelDefinition {
  level: number;
  title: string;
  emoji: string;
  minPoints: number;
}

// ===== Analytics (computed) =====

export interface DailyStats {
  date: string;            // YYYY-MM-DD
  count: number;
  avgCraving: number;
  avgEnjoyment: number;
  reasons: Partial<Record<SmokingReason, number>>;
  unnecessaryCount: number;
}

export interface HourlyDistribution {
  hour: number;
  count: number;
}

export interface ReasonAnalysis {
  reason: SmokingReason;
  count: number;
  avgCraving: number;
  avgEnjoyment: number;
  gapScore: number;        // craving - enjoyment
}

export interface PaceComparison {
  todayCount: number;
  historicalAvgAtThisHour: number;
  isAbove: boolean;
  diff: number;
}

export interface FeedbackMessage {
  text: string;
  emoji: string;
  priority: 'critical' | 'insight' | 'encouragement' | 'neutral';
}
