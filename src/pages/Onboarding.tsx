import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';

export default function Onboarding() {
  const setProfile = useAppStore((s) => s.setProfile);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [baseline, setBaseline] = useState('');

  const handleFinish = () => {
    setProfile({
      name: name.trim(),
      baseline: parseInt(baseline) || 15,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s <= step ? 'bg-green-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="text-6xl">👋</div>
            <h1 className="text-2xl font-bold">ברוך הבא!</h1>
            <p className="text-gray-400">איך קוראים לך?</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="השם שלך"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:border-green-400 transition-colors"
              autoFocus
            />
            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl py-3 text-lg font-medium transition-colors"
            >
              המשך
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-6">
            <div className="text-6xl">🚬</div>
            <h1 className="text-2xl font-bold">שלום {name}!</h1>
            <p className="text-gray-400">בערך כמה סיגריות אתה מעשן ביום?</p>
            <input
              type="number"
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              placeholder="למשל: 15"
              min="1"
              max="100"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-center text-3xl focus:outline-none focus:border-green-400 transition-colors"
              autoFocus
            />
            <p className="text-sm text-gray-500">
              זה יעזור לנו לעקוב אחרי ההתקדמות שלך
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 text-lg transition-colors"
              >
                חזרה
              </button>
              <button
                onClick={handleFinish}
                disabled={!baseline || parseInt(baseline) < 1}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl py-3 text-lg font-medium transition-colors"
              >
                🚀 בואנו!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
