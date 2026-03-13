import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CigaretteEntry, SmokingReason } from '../types';

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

interface CigaretteState {
  entries: CigaretteEntry[];
  activeEntryId: string | null;

  startCigarette: (craving: number, reason: SmokingReason, reasonCustom?: string) => CigaretteEntry;
  finishCigarette: (id: string, enjoyment: number) => void;
  autoFinishCigarette: (id: string) => void;
  addRetroactive: (entry: Omit<CigaretteEntry, 'id'>) => CigaretteEntry;
  deleteEntry: (id: string) => void;

  getToday: () => CigaretteEntry[];
  getByDate: (date: string) => CigaretteEntry[];
  getAllDates: () => string[];
  getActive: () => CigaretteEntry | null;
}

export const useCigaretteStore = create<CigaretteState>()(
  persist(
    (set, get) => ({
      entries: [],
      activeEntryId: null,

      startCigarette: (craving, reason, reasonCustom) => {
        const entry: CigaretteEntry = {
          id: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
          finishedAt: null,
          craving,
          reason,
          reasonCustom: reason === 'אחר' ? reasonCustom : undefined,
          enjoyment: null,
        };
        set((state) => ({
          entries: [...state.entries, entry],
          activeEntryId: entry.id,
        }));
        return entry;
      },

      finishCigarette: (id, enjoyment) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, finishedAt: new Date().toISOString(), enjoyment } : e
          ),
          activeEntryId: state.activeEntryId === id ? null : state.activeEntryId,
        }));
      },

      autoFinishCigarette: (id) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id
              ? { ...e, finishedAt: new Date().toISOString(), enjoyment: null, autoFinished: true }
              : e
          ),
          activeEntryId: state.activeEntryId === id ? null : state.activeEntryId,
        }));
      },

      addRetroactive: (entryData) => {
        const entry: CigaretteEntry = {
          id: crypto.randomUUID(),
          ...entryData,
          retroactive: true,
        };
        set((state) => ({
          entries: [...state.entries, entry].sort(
            (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
          ),
        }));
        return entry;
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
          activeEntryId: state.activeEntryId === id ? null : state.activeEntryId,
        }));
      },

      getToday: () => {
        const today = todayStr();
        return get().entries.filter((e) => new Date(e.startedAt).toLocaleDateString('en-CA') === today);
      },

      getByDate: (date) => {
        return get().entries.filter((e) => new Date(e.startedAt).toLocaleDateString('en-CA') === date);
      },

      getAllDates: () => {
        const dates = new Set(get().entries.map((e) => new Date(e.startedAt).toLocaleDateString('en-CA')));
        return Array.from(dates).sort().reverse();
      },

      getActive: () => {
        const { entries, activeEntryId } = get();
        if (!activeEntryId) return null;
        return entries.find((e) => e.id === activeEntryId) ?? null;
      },
    }),
    { name: 'qst_cigarettes' }
  )
);
