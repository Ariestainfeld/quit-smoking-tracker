import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AchievementState, UnlockedBadge } from '../types';
import { getLevelForPoints } from '../constants/levels';

interface AchievementActions {
  state: AchievementState;
  addPoints: (amount: number) => void;
  unlockBadge: (badgeId: string) => boolean; // returns true if newly unlocked
  markBadgeSeen: (badgeId: string) => void;
  markAllBadgesSeen: () => void;
  setStreak: (days: number) => void;
  getUnseenBadges: () => UnlockedBadge[];
}

const initialState: AchievementState = {
  points: 0,
  level: 1,
  unlockedBadges: [],
  streakDays: 0,
  longestStreak: 0,
};

export const useAchievementStore = create<AchievementActions>()(
  persist(
    (set, get) => ({
      state: initialState,

      addPoints: (amount) => {
        set((s) => {
          const newPoints = s.state.points + amount;
          const newLevel = getLevelForPoints(newPoints).level;
          return {
            state: { ...s.state, points: newPoints, level: newLevel },
          };
        });
      },

      unlockBadge: (badgeId) => {
        const existing = get().state.unlockedBadges.find((b) => b.badgeId === badgeId);
        if (existing) return false;

        const badge: UnlockedBadge = {
          badgeId,
          unlockedAt: new Date().toISOString(),
          seen: false,
        };
        set((s) => ({
          state: {
            ...s.state,
            unlockedBadges: [...s.state.unlockedBadges, badge],
          },
        }));
        return true;
      },

      markBadgeSeen: (badgeId) => {
        set((s) => ({
          state: {
            ...s.state,
            unlockedBadges: s.state.unlockedBadges.map((b) =>
              b.badgeId === badgeId ? { ...b, seen: true } : b
            ),
          },
        }));
      },

      markAllBadgesSeen: () => {
        set((s) => ({
          state: {
            ...s.state,
            unlockedBadges: s.state.unlockedBadges.map((b) => ({ ...b, seen: true })),
          },
        }));
      },

      setStreak: (days) => {
        set((s) => ({
          state: {
            ...s.state,
            streakDays: days,
            longestStreak: Math.max(s.state.longestStreak, days),
          },
        }));
      },

      getUnseenBadges: () => {
        return get().state.unlockedBadges.filter((b) => !b.seen);
      },
    }),
    {
      name: 'qst_achievements',
      partialize: (state) => ({ state: state.state }),
    }
  )
);
