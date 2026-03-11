import type { LevelDefinition } from '../types';

export const LEVELS: LevelDefinition[] = [
  { level: 1,  title: 'מתחיל',    emoji: '🌱', minPoints: 0 },
  { level: 2,  title: 'מודע',     emoji: '👀', minPoints: 50 },
  { level: 3,  title: 'עוקב',     emoji: '📊', minPoints: 150 },
  { level: 4,  title: 'מתמיד',    emoji: '💪', minPoints: 350 },
  { level: 5,  title: 'לוחם',     emoji: '⚔️', minPoints: 700 },
  { level: 6,  title: 'מתגבר',    emoji: '🏔️', minPoints: 1200 },
  { level: 7,  title: 'שולט',     emoji: '🎯', minPoints: 2000 },
  { level: 8,  title: 'מנצח',     emoji: '🏆', minPoints: 3500 },
  { level: 9,  title: 'חופשי',    emoji: '🦅', minPoints: 5500 },
  { level: 10, title: 'אלוף',     emoji: '👑', minPoints: 8000 },
];

export function getLevelForPoints(points: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(currentLevel: number): LevelDefinition | null {
  const idx = LEVELS.findIndex(l => l.level === currentLevel);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getProgressToNextLevel(points: number): number {
  const current = getLevelForPoints(points);
  const next = getNextLevel(current.level);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return Math.min(100, Math.round((progress / range) * 100));
}
