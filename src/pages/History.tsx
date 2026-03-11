import { useState } from 'react';
import { useCigaretteStore } from '../stores/useCigaretteStore';
import { getDailyStats } from '../lib/analytics';
import { formatDateHebrew, formatTime, todayStr } from '../lib/dateUtils';
import { SMOKING_REASONS, CRAVING_LABELS, ENJOYMENT_LABELS } from '../constants/reasons';

export default function History() {
  const getAllDates = useCigaretteStore((s) => s.getAllDates);
  const getByDate = useCigaretteStore((s) => s.getByDate);

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const dates = getAllDates();
  const today = todayStr();

  if (dates.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-bold mb-2">עוד אין היסטוריה</h2>
        <p className="text-gray-400">התחל לרשום סיגריות והנתונים יופיעו כאן</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold mb-4">📋 היסטוריה</h1>

      {dates.map((date) => {
        const dayEntries = getByDate(date);
        const stats = getDailyStats(dayEntries);
        const isExpanded = expandedDate === date;
        const isToday = date === today;

        return (
          <div key={date} className="bg-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedDate(isExpanded ? null : date)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${isToday ? 'text-green-400' : 'text-gray-300'}`}>
                  {stats.count}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {isToday ? 'היום' : formatDateHebrew(date)}
                  </div>
                  {stats.count > 0 && (
                    <div className="text-xs text-gray-500">
                      חשק {stats.avgCraving.toFixed(1)} · הנאה {stats.avgEnjoyment.toFixed(1)}
                      {stats.unnecessaryCount > 0 && ` · ${stats.unnecessaryCount} מיותרות`}
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-700 px-4 pb-3 space-y-2">
                {/* Day summary strip */}
                <div className="flex gap-2 py-2 overflow-x-auto">
                  {Object.entries(stats.reasons).map(([reason, count]) => {
                    const info = SMOKING_REASONS.find((r) => r.value === reason);
                    return (
                      <span key={reason} className="bg-gray-700 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        {info?.emoji} {info?.label || reason} ×{count}
                      </span>
                    );
                  })}
                </div>

                {/* Entry list */}
                {dayEntries.map((entry) => {
                  const reasonInfo = SMOKING_REASONS.find((r) => r.value === entry.reason);
                  const cravingInfo = CRAVING_LABELS.find((c) => c.value === entry.craving);
                  const enjoyInfo = entry.enjoyment !== null
                    ? ENJOYMENT_LABELS.find((e) => e.value === entry.enjoyment)
                    : null;
                  const gap = entry.enjoyment !== null ? entry.craving - entry.enjoyment : null;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between text-sm bg-gray-700/40 rounded-lg px-3 py-2 border-r-2 ${
                        gap !== null && gap >= 2 ? 'border-red-400' : gap !== null && gap <= 0 ? 'border-green-400' : 'border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs w-10">{formatTime(entry.startedAt)}</span>
                        <span>{reasonInfo?.emoji}</span>
                        <span className="text-gray-400">{reasonInfo?.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span title="חשק">
                          {cravingInfo?.emoji} {entry.craving}
                        </span>
                        {enjoyInfo ? (
                          <span title="הנאה">
                            {enjoyInfo.emoji} {entry.enjoyment}
                          </span>
                        ) : (
                          <span className="text-amber-400">⏳</span>
                        )}
                        {gap !== null && gap >= 2 && (
                          <span className="text-red-400 font-medium" title="פער">
                            ↕{gap}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
