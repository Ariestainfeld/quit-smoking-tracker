import { useLocation, useNavigate } from 'react-router-dom';
import { useAchievementStore } from '../../stores/useAchievementStore';

const tabs = [
  { path: '/', label: 'ראשי', emoji: '🏠' },
  { path: '/history', label: 'היסטוריה', emoji: '📋' },
  { path: '/analytics', label: 'תובנות', emoji: '📊' },
  { path: '/achievements', label: 'הישגים', emoji: '🏆' },
  { path: '/settings', label: 'הגדרות', emoji: '⚙️' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const unseenCount = useAchievementStore((s) => s.getUnseenBadges().length);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center py-2 px-3 relative transition-colors ${
                isActive ? 'text-green-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
              {tab.path === '/achievements' && unseenCount > 0 && (
                <span className="absolute -top-0.5 right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unseenCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
