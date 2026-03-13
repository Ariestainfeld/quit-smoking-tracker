import { useState, useEffect } from 'react';
import { useCigaretteStore } from '../stores/useCigaretteStore';
import { useAppStore } from '../stores/useAppStore';
import { useAchievementStore } from '../stores/useAchievementStore';
import { overallAverage, rollingAverage } from '../lib/analytics';
import { getTimeGreeting, formatTime } from '../lib/dateUtils';
import { getLevelForPoints } from '../constants/levels';
import { SMOKING_REASONS } from '../constants/reasons';
import LogModal from '../components/logging/LogModal';
import RetroactiveModal from '../components/logging/RetroactiveModal';
import { useAutoClose, requestNotificationPermission } from '../lib/useAutoClose';

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'new' | 'finish'>('new');
  const [retroOpen, setRetroOpen] = useState(false);

  // Auto-close active cigarettes after 15 min
  useAutoClose();

  // Request notification permission on first render
  useEffect(() => { requestNotificationPermission(); }, []);

  const entries = useCigaretteStore((s) => s.entries);
  const activeEntryId = useCigaretteStore((s) => s.activeEntryId);
  const getToday = useCigaretteStore((s) => s.getToday);
  const getActive = useCigaretteStore((s) => s.getActive);
  const profile = useAppStore((s) => s.profile)!;
  const achState = useAchievementStore((s) => s.state);

  const todayEntries = getToday();
  const todayCount = todayEntries.length;
  const avg = entries.length > 0 ? Math.round(overallAverage(entries) * 10) / 10 : profile.baseline;
  const weekAvg = entries.length > 0 ? Math.round(rollingAverage(entries, 7) * 10) / 10 : 0;
  const activeEntry = getActive();
  const level = getLevelForPoints(achState.points);
  const streak = achState.streakDays;

  // Timer for active cigarette
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!activeEntry) { setElapsed(''); return; }
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const handleLightUp = () => {
    if (activeEntryId) {
      setModalMode('finish');
    } else {
      setModalMode('new');
    }
    setModalOpen(true);
  };

  const isAboveAvg = todayCount > avg;

  return (
    <div className="space-y-4 pb-4">
      {/* Greeting + Level */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {getTimeGreeting()}, {profile.name}!
          </h1>
          <p className="text-gray-400 text-sm">
            {level.emoji} {level.title} • {achState.points} נקודות
          </p>
        </div>
        {streak > 0 && (
          <div className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
            🔥 {streak} ימים
          </div>
        )}
      </div>

      {/* Today Counter */}
      <div className="bg-gray-800 rounded-2xl p-6 text-center">
        <div className={`text-6xl font-bold ${isAboveAvg ? 'text-red-400' : 'text-green-400'}`}>
          {todayCount}
        </div>
        <p className="text-gray-400 mt-1">
          סיגריות היום {entries.length > 5 && `(ממוצע: ${avg})`}
        </p>
        {todayCount > 0 && todayCount < profile.baseline && (
          <p className="text-green-400 text-sm mt-2">
            💪 {profile.baseline - todayCount} פחות מה-baseline שלך
          </p>
        )}
        {todayCount >= profile.baseline && (
          <p className="text-red-400 text-sm mt-2">
            ⚠️ הגעת ל-baseline — נסה לעצור כאן
          </p>
        )}
      </div>

      {/* Active Cigarette Banner */}
      {activeEntry && (
        <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between pulse-soft">
          <div>
            <p className="text-amber-300 font-medium text-sm">🚬 סיגריה בתהליך</p>
            <p className="text-amber-200/70 text-xs">{elapsed}</p>
          </div>
          <button
            onClick={() => { setModalMode('finish'); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            סיימתי
          </button>
        </div>
      )}

      {/* Light Up Button */}
      {!activeEntry && (
        <div className="space-y-2">
          <button
            onClick={handleLightUp}
            className="w-full bg-gradient-to-l from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl py-5 text-xl font-bold transition-all active:scale-95 shadow-lg shadow-green-500/20"
          >
            🚬 מדליק סיגריה
          </button>
          <button
            onClick={() => setRetroOpen(true)}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-3 text-sm transition-colors border border-gray-700"
          >
            📝 שכחתי לרשום סיגריה
          </button>
        </div>
      )}

      {/* Today's Log */}
      {todayEntries.length > 0 && (
        <div className="bg-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">היום</h3>
          <div className="space-y-2">
            {todayEntries.slice().reverse().map((entry) => {
              const reasonInfo = SMOKING_REASONS.find((r) => r.value === entry.reason);
              return (
                <div key={entry.id} className="flex items-center justify-between text-sm bg-gray-700/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs w-10">{formatTime(entry.startedAt)}</span>
                    <span>{reasonInfo?.emoji || '🚬'}</span>
                    <span className="text-gray-300">{reasonInfo?.label || entry.reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.retroactive && (
                      <span className="text-blue-400 text-xs">📝</span>
                    )}
                    <span className="text-orange-300 text-xs">חשק {entry.craving}</span>
                    {entry.autoFinished ? (
                      <span className="text-red-400 text-xs">🔴 אוטו׳</span>
                    ) : entry.enjoyment !== null ? (
                      <span className="text-green-300 text-xs">הנאה {entry.enjoyment}</span>
                    ) : (
                      <span className="text-amber-400 text-xs">מעשן...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{weekAvg || '-'}</div>
            <div className="text-[10px] text-gray-500">ממוצע שבועי</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-purple-400">{profile.baseline}</div>
            <div className="text-[10px] text-gray-500">baseline</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-orange-400">{streak || '-'}</div>
            <div className="text-[10px] text-gray-500">ימי רצף</div>
          </div>
        </div>
      )}

      <LogModal isOpen={modalOpen} onClose={() => setModalOpen(false)} mode={modalMode} />
      <RetroactiveModal isOpen={retroOpen} onClose={() => setRetroOpen(false)} />
    </div>
  );
}
