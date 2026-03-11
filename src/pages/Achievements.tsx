import { useEffect } from 'react';
import { useAchievementStore } from '../stores/useAchievementStore';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { getLevelForPoints, getNextLevel, getProgressToNextLevel } from '../constants/levels';

export default function Achievements() {
  const { state, markAllBadgesSeen } = useAchievementStore();
  const level = getLevelForPoints(state.points);
  const nextLevel = getNextLevel(level.level);
  const progress = getProgressToNextLevel(state.points);
  const unlockedIds = new Set(state.unlockedBadges.map((b) => b.badgeId));
  const unseenIds = new Set(state.unlockedBadges.filter((b) => !b.seen).map((b) => b.badgeId));

  // Mark all as seen when visiting this page
  useEffect(() => {
    const timer = setTimeout(() => {
      markAllBadgesSeen();
    }, 2000);
    return () => clearTimeout(timer);
  }, [markAllBadgesSeen]);

  const categories = [
    { key: 'milestone', label: 'אבני דרך' },
    { key: 'reduction', label: 'הפחתה' },
    { key: 'consistency', label: 'עקביות' },
    { key: 'awareness', label: 'מודעות' },
    { key: 'special', label: 'מיוחדים' },
  ] as const;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">🏆 הישגים</h1>

      {/* Level + XP */}
      <div className="bg-gray-800 rounded-2xl p-5 text-center">
        <div className="text-4xl mb-1">{level.emoji}</div>
        <div className="text-xl font-bold">{level.title}</div>
        <div className="text-sm text-gray-400">רמה {level.level}</div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{state.points} נקודות</span>
            {nextLevel && <span>{nextLevel.minPoints} נקודות</span>}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-l from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {nextLevel && (
            <p className="text-xs text-gray-500 mt-1">
              {nextLevel.emoji} {nextLevel.title} — עוד {nextLevel.minPoints - state.points} נקודות
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex justify-around mt-4 pt-3 border-t border-gray-700">
          <div>
            <div className="text-lg font-bold text-orange-400">{state.streakDays}</div>
            <div className="text-[10px] text-gray-500">רצף נוכחי</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400">{state.longestStreak}</div>
            <div className="text-[10px] text-gray-500">רצף שיא</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">
              {state.unlockedBadges.length}/{BADGE_DEFINITIONS.length}
            </div>
            <div className="text-[10px] text-gray-500">הישגים</div>
          </div>
        </div>
      </div>

      {/* Badges by category */}
      {categories.map(({ key, label }) => {
        const badges = BADGE_DEFINITIONS.filter((b) => b.category === key);
        return (
          <div key={key}>
            <h3 className="text-sm font-medium text-gray-400 mb-2">{label}</h3>
            <div className="grid grid-cols-3 gap-2">
              {badges.map((badge) => {
                const isUnlocked = unlockedIds.has(badge.id);
                const isNew = unseenIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`bg-gray-800 rounded-xl p-3 text-center transition-all ${
                      isNew ? 'badge-new' : ''
                    } ${!isUnlocked ? 'opacity-40' : ''}`}
                  >
                    <div className={`text-3xl mb-1 ${!isUnlocked ? 'grayscale' : ''}`}>
                      {isUnlocked ? badge.emoji : '🔒'}
                    </div>
                    <div className="text-xs font-medium">
                      {isUnlocked ? badge.name : '???'}
                    </div>
                    {isUnlocked && (
                      <div className="text-[10px] text-gray-500 mt-0.5">{badge.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
