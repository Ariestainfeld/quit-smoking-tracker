import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 pb-16 max-w-lg mx-auto w-full px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
