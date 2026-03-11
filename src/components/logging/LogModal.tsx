import { useState, useEffect } from 'react';
import type { SmokingReason, FeedbackMessage } from '../../types';
import { useCigaretteStore } from '../../stores/useCigaretteStore';
import { useAppStore } from '../../stores/useAppStore';
import { useAchievementStore } from '../../stores/useAchievementStore';
import { CRAVING_LABELS, ENJOYMENT_LABELS, SMOKING_REASONS } from '../../constants/reasons';
import { generatePreSmokeFeedback, generatePostSmokeFeedback } from '../../lib/feedback';
import { calcEntryPoints, evaluateBadges, calculateStreak } from '../../lib/gamification';
import RatingScale from '../shared/RatingScale';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'new' | 'finish';
}

export default function LogModal({ isOpen, onClose, mode }: LogModalProps) {
  const [step, setStep] = useState(1);
  const [craving, setCraving] = useState<number | null>(null);
  const [reason, setReason] = useState<SmokingReason | null>(null);
  const [reasonCustom, setReasonCustom] = useState('');
  const [enjoyment, setEnjoyment] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [postFeedback, setPostFeedback] = useState<FeedbackMessage | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);

  const entries = useCigaretteStore((s) => s.entries);
  const activeEntryId = useCigaretteStore((s) => s.activeEntryId);
  const startCigarette = useCigaretteStore((s) => s.startCigarette);
  const finishCigarette = useCigaretteStore((s) => s.finishCigarette);
  const getToday = useCigaretteStore((s) => s.getToday);
  const profile = useAppStore((s) => s.profile)!;
  const { state: achState, addPoints, unlockBadge, setStreak } = useAchievementStore();

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (mode === 'finish') {
        setStep(4);
      } else {
        setStep(1);
      }
      setCraving(null);
      setReason(null);
      setReasonCustom('');
      setEnjoyment(null);
      setFeedback(null);
      setPostFeedback(null);
      setPointsEarned(0);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const todayCount = getToday().length;

  const handleConfirmStart = () => {
    if (craving === null || reason === null) return;

    // Generate pre-smoke feedback
    const fb = generatePreSmokeFeedback(entries, profile, reason, achState.streakDays);
    setFeedback(fb);

    // Create entry
    startCigarette(craving, reason, reason === 'אחר' ? reasonCustom : undefined);
    setStep(3);
  };

  const handleFinish = () => {
    if (enjoyment === null || !activeEntryId) return;

    const activeEntry = entries.find((e) => e.id === activeEntryId);
    if (!activeEntry) return;

    finishCigarette(activeEntryId, enjoyment);

    // Calculate points
    const newTodayCount = getToday().length;
    const pts = calcEntryPoints({ ...activeEntry, enjoyment }, newTodayCount);
    addPoints(pts.total);
    setPointsEarned(pts.total);

    // Post-smoke feedback
    const pf = generatePostSmokeFeedback(activeEntry.craving, enjoyment);
    setPostFeedback(pf);

    // Evaluate badges
    const updatedEntries = useCigaretteStore.getState().entries;
    const newBadges = evaluateBadges(updatedEntries, profile, achState);
    newBadges.forEach((id) => unlockBadge(id));

    // Update streak
    const streak = calculateStreak(updatedEntries);
    setStreak(streak);

    setStep(5);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 pb-8 space-y-5 mb-0 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step 1: Craving */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-center">כמה אתה חושק בסיגריה הזו?</h2>
            <RatingScale options={CRAVING_LABELS} value={craving} onChange={setCraving} />
            <button
              onClick={() => craving !== null && setStep(2)}
              disabled={craving === null}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl py-3 text-lg font-medium transition-colors"
            >
              הבא
            </button>
          </>
        )}

        {/* Step 2: Reason */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-center">למה אתה מדליק?</h2>
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
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 transition-colors"
              >
                חזרה
              </button>
              <button
                onClick={handleConfirmStart}
                disabled={reason === null}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl py-3 font-medium transition-colors"
              >
                🔥 מדליק!
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirmed + Feedback */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🚬</div>
            <h2 className="text-xl font-bold">
              סיגריה #{todayCount} היום
            </h2>
            {feedback && (
              <div
                className={`p-4 rounded-xl text-sm ${
                  feedback.priority === 'critical'
                    ? 'bg-red-500/20 text-red-300'
                    : feedback.priority === 'insight'
                    ? 'bg-amber-500/20 text-amber-300'
                    : feedback.priority === 'encouragement'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                <span className="text-lg ml-2">{feedback.emoji}</span>
                {feedback.text}
              </div>
            )}
            <p className="text-gray-400 text-sm">כשתסיים — חזור לדרג את ההנאה</p>
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 transition-colors"
            >
              סגור
            </button>
          </div>
        )}

        {/* Step 4: Enjoyment (finish mode) */}
        {step === 4 && (
          <>
            <h2 className="text-xl font-bold text-center">כמה נהנית?</h2>
            <RatingScale options={ENJOYMENT_LABELS} value={enjoyment} onChange={setEnjoyment} />
            <button
              onClick={handleFinish}
              disabled={enjoyment === null}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl py-3 text-lg font-medium transition-colors"
            >
              ✅ סיימתי
            </button>
          </>
        )}

        {/* Step 5: Post-smoke feedback */}
        {step === 5 && (
          <div className="text-center space-y-4">
            {postFeedback ? (
              <div
                className={`p-4 rounded-xl ${
                  postFeedback.priority === 'insight'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-green-500/20 text-green-300'
                }`}
              >
                <span className="text-2xl block mb-2">{postFeedback.emoji}</span>
                <p>{postFeedback.text}</p>
              </div>
            ) : (
              <div className="text-5xl">✅</div>
            )}
            {pointsEarned > 0 && (
              <div className="text-green-400 font-bold text-lg">+{pointsEarned} נקודות</div>
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
