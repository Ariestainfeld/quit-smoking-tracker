import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, ReferenceLine,
} from 'recharts';
import { useCigaretteStore } from '../stores/useCigaretteStore';
import { useAppStore } from '../stores/useAppStore';
import {
  getAllDailyStats, reasonAnalysis, unnecessaryPercentage,
  hourlyDistribution, weeklyComparison, trendDirection,
} from '../lib/analytics';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 ימים' },
  { value: 30, label: '30 ימים' },
  { value: 0, label: 'הכל' },
];

const REASON_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#6b7280'];

export default function Analytics() {
  const entries = useCigaretteStore((s) => s.entries);
  const profile = useAppStore((s) => s.profile)!;
  const [period, setPeriod] = useState(7);

  const filteredEntries = useMemo(() => {
    if (period === 0) return entries;
    const cutoff = new Date(Date.now() - period * 86400000).toLocaleDateString('en-CA');
    return entries.filter((e) => new Date(e.startedAt).toLocaleDateString('en-CA') >= cutoff);
  }, [entries, period]);

  const dailyStats = useMemo(() => getAllDailyStats(filteredEntries), [filteredEntries]);
  const reasons = useMemo(() => reasonAnalysis(filteredEntries), [filteredEntries]);
  const unnPct = useMemo(() => unnecessaryPercentage(filteredEntries), [filteredEntries]);
  const hourly = useMemo(() => hourlyDistribution(filteredEntries), [filteredEntries]);
  const weekly = useMemo(() => weeklyComparison(entries), [entries]);
  const trend = useMemo(() => trendDirection(getAllDailyStats(entries)), [entries]);

  if (entries.length < 3) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-xl font-bold mb-2">עוד אין מספיק נתונים</h2>
        <p className="text-gray-400">רשום עוד כמה סיגריות ונראה לך תובנות</p>
      </div>
    );
  }

  const trendEmoji = trend === 'improving' ? '📉' : trend === 'worsening' ? '📈' : '➡️';
  const trendText = trend === 'improving' ? 'מגמת שיפור!' : trend === 'worsening' ? 'מגמת עלייה' : 'יציב';

  // Pie data
  const pieData = reasons.map((r) => ({ name: r.reason, value: r.count }));

  // Craving vs Enjoyment bar data
  const barData = reasons.slice(0, 6).map((r) => ({
    reason: r.reason,
    חשק: r.avgCraving,
    הנאה: r.avgEnjoyment,
  }));

  // Hourly heatmap max
  const maxHour = Math.max(...hourly.map((h) => h.count), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">📊 תובנות</h1>
        <div className="bg-gray-800 rounded-full p-0.5 flex gap-0.5">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                period === p.value ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trend indicator */}
      <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
        <span className="text-gray-300">מגמה כללית</span>
        <span className={`font-medium ${trend === 'improving' ? 'text-green-400' : trend === 'worsening' ? 'text-red-400' : 'text-gray-400'}`}>
          {trendEmoji} {trendText}
        </span>
      </div>

      {/* Chart 1: Daily Trend */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">סיגריות ליום</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => d.slice(5)} // MM-DD
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, direction: 'rtl' }}
              labelFormatter={(d) => d}
            />
            <ReferenceLine y={profile.baseline} stroke="#ef4444" strokeDasharray="5 5" label="" />
            <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> בפועל</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block border-dashed" /> baseline ({profile.baseline})</span>
        </div>
      </div>

      {/* Chart 2: Reason Breakdown */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">סיבות לעישון</h3>
        <div className="flex items-center">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={REASON_COLORS[i % REASON_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 flex-1">
            {reasons.map((r, i) => (
              <div key={r.reason} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REASON_COLORS[i % REASON_COLORS.length] }} />
                <span className="text-gray-300">{r.reason}</span>
                <span className="text-gray-500 mr-auto">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Craving vs Enjoyment */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">חשק vs הנאה לפי סיבה</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis type="category" dataKey="reason" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, direction: 'rtl' }} />
            <Bar dataKey="חשק" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            <Bar dataKey="הנאה" fill="#22c55e" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {reasons[0] && reasons[0].gapScore >= 1.5 && (
          <p className="text-amber-300 text-xs mt-2">
            💡 הפער הגדול ביותר: "{reasons[0].reason}" — חשק {reasons[0].avgCraving}, הנאה {reasons[0].avgEnjoyment}
          </p>
        )}
      </div>

      {/* Chart 4: Unnecessary metric */}
      <div className="bg-gray-800 rounded-xl p-4 text-center">
        <h3 className="text-sm font-medium text-gray-400 mb-2">סיגריות "מיותרות"</h3>
        <div className={`text-4xl font-bold ${unnPct > 50 ? 'text-red-400' : unnPct > 25 ? 'text-amber-400' : 'text-green-400'}`}>
          {unnPct}%
        </div>
        <p className="text-xs text-gray-500 mt-1">מהסיגריות שלך ההנאה נמוכה בהרבה מהחשק</p>
      </div>

      {/* Chart 5: Time Heatmap */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">שעות עישון</h3>
        <div className="grid grid-cols-12 gap-1">
          {hourly.filter((h) => h.hour >= 6 && h.hour <= 23).map((h) => {
            const intensity = h.count / maxHour;
            return (
              <div key={h.hour} className="text-center">
                <div
                  className="w-full aspect-square rounded"
                  style={{
                    backgroundColor: h.count > 0
                      ? `rgba(34, 197, 94, ${0.15 + intensity * 0.85})`
                      : '#1f2937',
                  }}
                  title={`${h.hour}:00 — ${h.count} סיגריות`}
                />
                <span className="text-[8px] text-gray-500">{h.hour}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 6: Weekly Comparison */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">השבוע vs שבוע שעבר</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">סה"כ</div>
            <div className="text-lg font-bold text-green-400">{weekly.thisWeek.count}</div>
            <div className="text-xs text-gray-500">vs {weekly.lastWeek.count}</div>
            {weekly.countChange !== 0 && (
              <div className={`text-xs ${weekly.countChange < 0 ? 'text-green-400' : 'text-red-400'}`}>
                {weekly.countChange > 0 ? '+' : ''}{weekly.countChange}%
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">חשק ממוצע</div>
            <div className="text-lg font-bold text-orange-400">{weekly.thisWeek.avgCraving.toFixed(1)}</div>
            <div className="text-xs text-gray-500">vs {weekly.lastWeek.avgCraving.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">הנאה ממוצעת</div>
            <div className="text-lg font-bold text-blue-400">{weekly.thisWeek.avgEnjoyment.toFixed(1)}</div>
            <div className="text-xs text-gray-500">vs {weekly.lastWeek.avgEnjoyment.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
