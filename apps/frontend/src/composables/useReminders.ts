import { db } from '@/db/schema';
import type { CalendarEvent } from '@time-gestion/shared';

let reminderInterval: ReturnType<typeof setInterval> | null = null;
const notifiedEvents = new Set<string>();

export function useReminders() {
  async function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
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
    reminderInterval = setInterval(checkReminders, 60_000);
  }

  function stopReminders() {
    if (reminderInterval) {
      clearInterval(reminderInterval);
      reminderInterval = null;
    }
  }

  return { requestPermission, startReminders, stopReminders, checkReminders };
}
