import { db } from '@/db/schema';
import type { CalendarEvent } from '@time-gestion/shared';

let reminderInterval: ReturnType<typeof setInterval> | null = null;
const notifiedEvents = new Set<string>();

export function useReminders() {
  async function requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return false;
  }

  async function checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = Date.now();
    const events = await db.events.filter(e => !e.deletedAt && e.reminderMinutes != null).toArray();

    for (const event of events) {
      if (notifiedEvents.has(event.id)) continue;

      const eventTime = new Date(event.startAt).getTime();
      const reminderTime = eventTime - (event.reminderMinutes! * 60 * 1000);

      if (now >= reminderTime && now < eventTime) {
        showNotification(event);
        notifiedEvents.add(event.id);
      }
    }
  }

  function showNotification(event: CalendarEvent) {
    const time = event.allDay
      ? 'Toute la journee'
      : new Date(event.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    new Notification(event.title, {
      body: `${time} - ${event.description || 'Evenement a venir'}`,
      icon: '/icon-192.png',
      tag: event.id,
    });
  }

  function startReminders() {
    checkReminders();
    reminderInterval = setInterval(checkReminders, 30_000);

    // Reset notifiedEvents at midnight, then every 24h
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      notifiedEvents.clear();
      setInterval(() => {
        notifiedEvents.clear();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  function stopReminders() {
    if (reminderInterval) {
      clearInterval(reminderInterval);
      reminderInterval = null;
    }
  }

  return { requestPermission, startReminders, stopReminders, checkReminders };
}
