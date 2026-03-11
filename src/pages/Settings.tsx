import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useCigaretteStore } from '../stores/useCigaretteStore';
import { useAchievementStore } from '../stores/useAchievementStore';
import { formatDateHebrew } from '../lib/dateUtils';

export default function Settings() {
  const profile = useAppStore((s) => s.profile)!;
  const updateProfile = useAppStore((s) => s.updateProfile);
  const entries = useCigaretteStore((s) => s.entries);
  const achState = useAchievementStore((s) => s.state);

  const [name, setName] = useState(profile.name);
  const [baseline, setBaseline] = useState(String(profile.baseline));
  const [saved, setSaved] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSave = () => {
    updateProfile({
      name: name.trim() || profile.name,
      baseline: parseInt(baseline) || profile.baseline,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = {
      profile: useAppStore.getState().profile,
      entries: useCigaretteStore.getState().entries,
      achievements: useAchievementStore.getState().state,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quit-tracker-backup-${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.profile) useAppStore.setState({ profile: data.profile, isOnboarded: true });
        if (data.entries) useCigaretteStore.setState({ entries: data.entries, activeEntryId: null });
        if (data.achievements) useAchievementStore.setState({ state: data.achievements });
        alert('הנתונים יובאו בהצלחה!');
      } catch {
        alert('שגיאה בקריאת הקובץ');
      }
    };
    input.click();
  };

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">⚙️ הגדרות</h1>

      {/* Profile */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-400">פרופיל</h3>

        <div>
          <label className="text-xs text-gray-500 block mb-1">שם</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">כמות מוערכת ליום (baseline)</label>
          <input
            type="number"
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            min="1"
            max="100"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
          />
        </div>

        <button
          onClick={handleSave}
          className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
            saved ? 'bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {saved ? '✅ נשמר!' : 'שמור שינויים'}
        </button>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-400">סטטיסטיקות</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-700/50 rounded-lg p-2">
            <span className="text-gray-400">סה"כ רישומים: </span>
            <span className="font-medium">{entries.length}</span>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2">
            <span className="text-gray-400">ימי מעקב: </span>
            <span className="font-medium">{new Set(entries.map((e) => new Date(e.startedAt).toLocaleDateString('en-CA'))).size}</span>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2">
            <span className="text-gray-400">נקודות: </span>
            <span className="font-medium">{achState.points}</span>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2">
            <span className="text-gray-400">הישגים: </span>
            <span className="font-medium">{achState.unlockedBadges.length}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          התחלת מעקב: {formatDateHebrew(profile.createdAt.slice(0, 10))}
        </p>
      </div>

      {/* Data management */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-400">נתונים</h3>
        <button
          onClick={handleExport}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm transition-colors"
        >
          📥 ייצוא נתונים (גיבוי)
        </button>
        <button
          onClick={handleImport}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm transition-colors"
        >
          📤 ייבוא נתונים
        </button>
      </div>

      {/* Reset */}
      <div className="bg-gray-800 rounded-xl p-4">
        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg py-2 text-sm transition-colors"
          >
            🗑️ איפוס כל הנתונים
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-red-400 text-sm text-center">בטוח? כל הנתונים יימחקו לצמיתות</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm transition-colors"
              >
                כן, מחק הכל
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
