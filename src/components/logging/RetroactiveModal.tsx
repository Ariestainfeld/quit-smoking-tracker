import { useState, useEffect } from 'react';
import type { SmokingReason } from '../../types';
import { useCigaretteStore } from '../../stores/useCigaretteStore';
import { useAchievementStore } from '../../stores/useAchievementStore';
import { useAppStore } from '../../stores/useAppStore';
import { CRAVING_LABELS, ENJOYMENT_LABELS, SMOKING_REASONS } from '../../constants/reasons';
import { calcEntryPoints, evaluateBadges, calculateStreak } from '../../lib/gamification';
import RatingScale from '../shared/RatingScale';

interface RetroactiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'datetime' | 'remember' | 'craving' | 'reason' | 'enjoyment' | 'done';

export default function RetroactiveModal({ isOpen, onClose }: RetroactiveModalProps) {
  const [step, setStep] = useState<Step>('datetime');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [remembers, setRemembers] = useState<boolean | null>(null);
  const [craving, setCraving] = useState<number | null>(null);
  const [reason, setReason] = useState<SmokingReason | null>(null);
  const [reasonCustom, setReasonCustom] = useState('');
  const [enjoyment, setEnjoyment] = useState<number | null>(null);

  const addRetroactive = useCigaretteStore((s) => s.addRetroactive);
  const profile = useAppStore((s) => s.profile)!;
  const { state: achState, addPoints, unlockBadge, setStreak } = useAchievementStore();

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      // Default to now
      const now = new Date();
      setDate(now.toLocaleDateString('en-CA'));
      setTime(now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setStep('datetime');
      setRemembers(null);
      setCraving(null);
      setReason(null);
      setReasonCustom('');
      setEnjoyment(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDateTimeNext = () => {
    if (!date || !time) return;
    setStep('remember');
  };

  const handleRememberChoice = (choice: boolean) => {
    setRemembers(choice);
    if (choice) {
      setStep('craving');
    } else {
      // Just log minimal entry
      saveEntry(null, null, null);
    }
  };

  const handleCravingNext = () => {
    if (craving === null) return;
    setStep('reason');
  };

  const handleReasonNext = () => {
    if (reason === null) return;
    setStep('enjoyment');
  };

  const handleEnjoymentFinish = () => {
    saveEntry(craving, reason, enjoyment);
  };

  const saveEntry = (
    cravingVal: number | null,
    reasonVal: SmokingReason | null,
    enjoymentVal: number | null
  ) => {
    const startedAt = new Date(`${date}T${time}:00`).toISOString();
    const finishedAt = startedAt; // retroactive — same time

    const entry = addRetroactive({
      startedAt,
      finishedAt,
      craving: cravingVal ?? 3, // default middle if unknown
      reason: reasonVal ?? 'אחר',
      reasonCustom: reasonVal === null ? 'לא זוכר' : (reasonVal === 'אחר' ? reasonCustom : undefined),
      enjoyment: enjoymentVal,
      autoFinished: false,
      retroactive: true,
    });

    // Award points if full details provided
    if (cravingVal !== null && enjoymentVal !== null) {
      const todayEntries = useCigaretteStore.getState().getToday();
      const pts = calcEntryPoints({ ...entry, enjoyment: enjoymentVal }, todayEntries.length);
      addPoints(pts.total);
    } else {
      // Minimal points for just logging
      addPoints(2);
    }

    // Evaluate badges & streak
    const updatedEntries = useCigaretteStore.getState().entries;
    const newBadges = evaluateBadges(updatedEntries, profile, achState);
    newBadges.forEach((id) => unlockBadge(id));
    const streak = calculateStreak(updatedEntries);
    setStreak(streak);

    setStep('done');
  };

  // Max date = today
  const maxDate = new Date().toLocaleDateString('en-CA');
  // Min date = yesterday
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  })();

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step: Date & Time */}
        {step === 'datetime' && (
          <>
            <h2 className="text-xl font-bold text-center">📝 רישום בדיעבד</h2>
            <p className="text-gray-400 text-sm text-center">מתי עישנת את הסיגריה?</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">תאריך</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-400 text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">שעה</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-400 text-center text-lg"
                />
              </div>
            </div>
            <button
              onClick={handleDateTimeNext}
              disabled={!date || !time}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl py-3 text-lg font-medium transition-colors"
            >
              הבא
            </button>
          </>
        )}

        {/* Step: Remember? */}
        {step === 'remember' && (
          <>
            <h2 className="text-xl font-bold text-center">🤔 זוכר איך היה?</h2>
            <p className="text-gray-400 text-sm text-center">
              אם כן — נמלא את הפרטים. אם לא — רק נרשום שעישנת.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRememberChoice(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-4 text-lg transition-colors"
              >
                😶 לא זוכר
              </button>
              <button
                onClick={() => handleRememberChoice(true)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl py-4 text-lg font-medium transition-colors"
              >
                👍 כן, זוכר!
              </button>
            </div>
          </>
        )}

        {/* Step: Craving */}
        {step === 'craving' && (
          <>
            <h2 className="text-xl font-bold text-center">כמה חשקת בסיגריה?</h2>
            <RatingScale options={CRAVING_LABELS} value={craving} onChange={setCraving} />
            <div className="flex gap-3">
              <button
                onClick={() => setStep('remember')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 transition-colors"
              >
                חזרה
              </button>
              <button
                onClick={handleCravingNext}
                disabled={craving === null}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl py-3 font-medium transition-colors"
              >
                הבא
              </button>
            </div>
          </>
        )}

        {/* Step: Reason */}
        {step === 'reason' && (
          <>
            <h2 className="text-xl font-bold text-center">למה עישנת?</h2>
            <div className="grid grid-cols-2 gap-2">
              {SMOKING_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-all ${
                    reason === r.value
                      ? 'bg-green-500/20 ring-2 ring-green-400 text-green-300'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <span className="text-lg">{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
            {reason === 'אחר' && (
              <input
                type="text"
                value={reasonCustom}
                onChange={(e) => setReasonCustom(e.target.value)}
                placeholder="מה הסיבה?"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 focus:outline-none focus:border-green-400"
                autoFocus
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('craving')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 transition-colors"
              >
                חזרה
              </button>
              <button
                onClick={handleReasonNext}
                disabled={reason === null}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl py-3 font-medium transition-colors"
              >
                הבא
              </button>
            </div>
          </>
        )}

        {/* Step: Enjoyment */}
        {step === 'enjoyment' && (
          <>
            <h2 className="text-xl font-bold text-center">כמה נהנית?</h2>
            <RatingScale options={ENJOYMENT_LABELS} value={enjoyment} onChange={setEnjoyment} />
            <div className="flex gap-3">
              <button
                onClick={() => setStep('reason')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 transition-colors"
              >
                חזרה
              </button>
              <button
                onClick={handleEnjoymentFinish}
                disabled={enjoyment === null}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl py-3 font-medium transition-colors"
              >
                ✅ שמור
              </button>
            </div>
          </>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold">
              {remembers ? 'נרשם עם כל הפרטים!' : 'הסיגריה נרשמה'}
            </h2>
            <p className="text-gray-400 text-sm">
              {remembers
                ? '🎯 מעולה שזכרת — זה עוזר לניתוח!'
                : '📝 בפעם הבאה נסה לרשום בזמן אמת'}
            </p>
            {remembers && (
              <div className="text-green-400 font-bold text-lg">+נקודות מלאות</div>
            )}
            {!remembers && (
              <div className="text-gray-500 font-medium">+2 נקודות (רישום בסיסי)</div>
            )}
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 transition-colors"
            >
              סגור
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
