import { useEffect, useRef, useCallback } from 'react';
import { useCigaretteStore } from '../stores/useCigaretteStore';

const REMINDER_1_MS = 5 * 60 * 1000;  // 5 minutes
const REMINDER_2_MS = 10 * 60 * 1000; // 10 minutes
const AUTO_CLOSE_MS = 15 * 60 * 1000; // 15 minutes

function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🚬', tag: 'qst-reminder' });
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Hook that monitors the active cigarette and:
 * 1. After 5 min — sends push notification reminder
 * 2. After 10 min — sends second notification
 * 3. After 15 min — auto-closes the cigarette (no enjoyment, marked autoFinished)
 */
export function useAutoClose() {
  const activeEntryId = useCigaretteStore((s) => s.activeEntryId);
  const entries = useCigaretteStore((s) => s.entries);
  const autoFinishCigarette = useCigaretteStore((s) => s.autoFinishCigarette);

  const timer1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer3 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timer1.current) { clearTimeout(timer1.current); timer1.current = null; }
    if (timer2.current) { clearTimeout(timer2.current); timer2.current = null; }
    if (timer3.current) { clearTimeout(timer3.current); timer3.current = null; }
  }, []);

  useEffect(() => {
    clearTimers();

    if (!activeEntryId) return;

    const activeEntry = entries.find((e) => e.id === activeEntryId);
    if (!activeEntry) return;

    const startTime = new Date(activeEntry.startedAt).getTime();
    const elapsed = Date.now() - startTime;

    // Schedule remaining timers based on how much time already passed
    const remaining1 = REMINDER_1_MS - elapsed;
    const remaining2 = REMINDER_2_MS - elapsed;
    const remaining3 = AUTO_CLOSE_MS - elapsed;

    if (remaining3 <= 0) {
      // Already past auto-close — close immediately
      autoFinishCigarette(activeEntryId);
      return;
    }

    if (remaining1 > 0) {
      timer1.current = setTimeout(() => {
        sendNotification('🚬 עוד מעשן?', 'עברו 5 דקות — סיימת את הסיגריה?');
      }, remaining1);
    }

    if (remaining2 > 0) {
      timer2.current = setTimeout(() => {
        sendNotification('⏰ תזכורת אחרונה', 'עוד 5 דקות הסיגריה תיסגר אוטומטית');
      }, remaining2);
    }

    timer3.current = setTimeout(() => {
      autoFinishCigarette(activeEntryId);
      sendNotification('🔴 כובה אוטומטית', 'הסיגריה נסגרה אחרי 15 דקות ללא תגובה');
    }, remaining3);

    return clearTimers;
  }, [activeEntryId, entries, autoFinishCigarette, clearTimers]);
}
