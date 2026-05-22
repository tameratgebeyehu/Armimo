// ─────────────────────────────────────────────
// Armimo / አርምሞ — Local Notification Service v3
// ─────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AppSettings, StudySession, Task } from '../types';
import { toISODateString } from '../utils/dateUtils';

// ── Global Handler ────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Android Channels ──────────────────────────
const CH = {
  STUDY:    { id: 'study_reminders',  name: 'Study Reminders',     importance: Notifications.AndroidImportance.HIGH },
  FOCUS:    { id: 'focus_timer',      name: 'Focus Timer',         importance: Notifications.AndroidImportance.MAX },
  DEADLINE: { id: 'task_deadlines',   name: 'Task Deadlines',      importance: Notifications.AndroidImportance.HIGH },
  STREAK:   { id: 'streak_nudge',     name: 'Streak & Daily Goal', importance: Notifications.AndroidImportance.HIGH },
};

async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;
  for (const ch of Object.values(CH)) {
    await Notifications.setNotificationChannelAsync(ch.id, {
      name:             ch.name,
      importance:       ch.importance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#2563EB',
      sound:            'default',
      enableVibrate:    true,
      showBadge:        true,
    });
  }
}

// ── Internal Helpers ──────────────────────────
function parseTime(t: string): { hour: number; minute: number } {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return { hour: h, minute: m };
}

function triggerTimeFor(startTime: string, minsBefore: number) {
  const { hour, minute } = parseTime(startTime);
  let total = hour * 60 + minute - minsBefore;
  const wraps = total < 0;
  if (wraps) total += 24 * 60;
  return { hour: Math.floor(total / 60), minute: total % 60, wraps };
}

// JS dayOfWeek (0=Sun…6=Sat) → Expo weekday (1=Sun…7=Sat)
const toExpoWd = (js: number) => js + 1;

// ── Concurrency Queue & Collapse Lock ─────────
let isSyncing = false;
let hasPendingSync = false;
let pendingArgs: {
  settings: AppSettings;
  sessions: StudySession[];
  tasks: Task[];
  todayFocusSeconds: number;
} | null = null;
let pendingResolvers: (() => void)[] = [];

async function runSyncQueue(): Promise<void> {
  if (isSyncing) {
    hasPendingSync = true;
    return new Promise<void>((resolve) => {
      pendingResolvers.push(resolve);
    });
  }
  isSyncing = true;
  hasPendingSync = false;

  const currentResolvers = [...pendingResolvers];
  pendingResolvers = [];

  try {
    const args = pendingArgs;
    if (args) {
      await performSyncAllNotifications(args.settings, args.sessions, args.tasks, args.todayFocusSeconds);
    }
  } catch (e) {
    console.warn('[Notif] sync execution error:', e);
  } finally {
    isSyncing = false;
    
    // Resolve all promises waiting for this run
    currentResolvers.forEach((resolve) => resolve());

    if (hasPendingSync && pendingArgs) {
      // Trigger the next sync with the latest state
      await runSyncQueue();
    }
  }
}

// ── Actual Sync Implementation ────────────────
async function performSyncAllNotifications(
  settings: AppSettings,
  sessions: StudySession[],
  tasks: Task[],
  todayFocusSeconds: number,
): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    // Check if there is an active focus session running.
    // If not, or if notifications are disabled, explicitly cancel any scheduled active_focus_timer_end notification!
    let isFocusRunning = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useFocusStore } = require('../store/focusStore') as typeof import('../store/focusStore');
      isFocusRunning = useFocusStore.getState().timerState === 'running';
    } catch (e) {
      console.warn('[Notif] failed to check focusStore state:', e);
    }

    for (const notif of scheduled) {
      if (notif.identifier === 'active_focus_timer_end') {
        if (!isFocusRunning || !settings.notifications.enabled) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
        continue; // Preserve if running & notifications are enabled
      }
      
      // Clean up legacy focus_end notifications scheduled under random UUIDs
      if (notif.content.data?.type === 'focus_end') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        continue;
      }

      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }

    if (!settings.notifications.enabled) return;

    const { language: lang, notifications: ns } = settings;
    let count = 0;
    const MAX = 60; // iOS hard-caps at 64; leave buffer

    const sched = async (req: Notifications.NotificationRequestInput) => {
      if (count >= MAX) return;
      await Notifications.scheduleNotificationAsync(req);
      count++;
    };

    const nowTime = Date.now();
    const TWO_MINUTES_MS = 2 * 60 * 1000;

    // ── A. Daily Goal Reminder (Date-based 7-day rolling triggers) ──
    if (ns.dailyGoalReminders) {
      const { hour, minute } = parseTime(ns.dailyReminderTime);
      const goalSeconds = (settings.dailyFocusGoalHours ?? 2) * 3600;
      const reachedGoalToday = todayFocusSeconds >= goalSeconds;

      for (let i = 0; i < 7; i++) {
        if (count >= MAX) break;

        const targetDate = new Date(nowTime);
        targetDate.setDate(targetDate.getDate() + i);
        targetDate.setHours(hour, minute, 0, 0);

        if (i === 0) {
          // Today: skip if already met goal, or if reminder time already passed (with safety buffer)
          if (reachedGoalToday || targetDate.getTime() <= nowTime + TWO_MINUTES_MS) {
            continue;
          }
        }

        const dateStr = toISODateString(targetDate);

        await sched({
          identifier: `daily_goal_reminder_${dateStr}`,
          content: {
            title: lang === 'am' ? 'የእለት ትኩረት አስታዋሽ' : 'Daily Focus Reminder',
            body:  lang === 'am'
              ? 'ዛሬ ያጠናሉ? የዕለት ትኩረት ግብዎን ገና አላሳኩም።'
              : "You haven't reached your daily focus goal yet.",
            sound: true,
            data: { type: 'daily_goal', date: dateStr },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: targetDate,
            channelId: CH.STREAK.id,
          },
        });
      }
    }

    // ── B. Streak Consistency Reminder (Date-based 7-day rolling triggers) ──
    if (ns.streakReminders) {
      const { hour, minute } = parseTime(ns.streakReminderTime);
      const studiedToday = todayFocusSeconds > 0;

      for (let i = 0; i < 7; i++) {
        if (count >= MAX) break;

        const targetDate = new Date(nowTime);
        targetDate.setDate(targetDate.getDate() + i);
        targetDate.setHours(hour, minute, 0, 0);

        if (i === 0) {
          // Today: skip if already studied today, or if reminder time already passed (with safety buffer)
          if (studiedToday || targetDate.getTime() <= nowTime + TWO_MINUTES_MS) {
            continue;
          }
        }

        const dateStr = toISODateString(targetDate);

        await sched({
          identifier: `streak_reminder_${dateStr}`,
          content: {
            title: lang === 'am' ? 'ስትሪክ አስታዋሽ' : 'Streak Reminder',
            body:  lang === 'am'
              ? 'ዛሬ ቢያንስ አንዴ ያጥናሉ? ቀጣይነትዎን ይጠብቁ።'
              : 'Study at least once today to maintain your streak.',
            sound: true,
            data: { type: 'streak_reminder', date: dateStr },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: targetDate,
            channelId: CH.STREAK.id,
          },
        });
      }
    }

    // ── C. Study Session Reminders (Timetable) ──
    if (ns.studySessionReminders) {
      const mb = ns.reminderMinutesBefore;

      for (let i = 0; i < 7; i++) {
        if (count >= MAX) break;

        const targetDate = new Date(nowTime);
        targetDate.setDate(targetDate.getDate() + i);
        const dayOfWeek = targetDate.getDay();
        const dateStr = toISODateString(targetDate);

        for (const s of sessions) {
          if (count >= MAX) break;

          // Check if this session applies to targetDate
          let applies = false;
          if (s.isRecurring) {
            if (s.recurringPattern === 'daily') {
              applies = true;
            } else if (s.recurringPattern === 'weekdays') {
              applies = dayOfWeek >= 1 && dayOfWeek <= 5;
            } else if (s.recurringPattern === 'weekly') {
              applies = s.dayOfWeek === dayOfWeek;
            }
          } else {
            // One-time session
            if (s.date) {
              applies = s.date === dateStr;
            } else {
              applies = s.dayOfWeek === dayOfWeek;
            }
          }

          if (!applies) continue;

          // Check if already completed on targetDate
          const completedDates = s.completedDates || [];
          const isCompleted = completedDates.includes(dateStr) || (!s.isRecurring && s.completed);
          if (isCompleted) continue;

          // Calculate trigger time
          const { hour: th, minute: tm, wraps } = triggerTimeFor(s.startTime, mb);
          const triggerDate = new Date(targetDate);
          triggerDate.setHours(th, tm, 0, 0);
          if (wraps) {
            triggerDate.setDate(triggerDate.getDate() - 1);
          }

          // Schedule if in the future (with 2 min safety buffer)
          if (triggerDate.getTime() > nowTime + TWO_MINUTES_MS) {
            const label = s.title || s.subject;
            await sched({
              identifier: `study_session_${s.id}_${dateStr}`,
              content: {
                title: lang === 'am' ? `የጥናት አስታዋሽ — ${label}` : `Study Reminder — ${label}`,
                body:  lang === 'am'
                  ? `ክፍለ ጊዜዎ በ ${mb} ደቂቃ ውስጥ ይጀምራል።`
                  : `Your study session begins in ${mb} minute${mb !== 1 ? 's' : ''}.`,
                sound: true,
                data:  { sessionId: s.id, type: 'study_session', date: dateStr },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
                channelId: CH.STUDY.id,
              },
            });
          }
        }
      }
    }

    // ── D. Task Deadline Reminders ────────────
    if (ns.deadlineReminders) {
      for (const task of tasks) {
        if (count >= MAX) break;
        if (task.completed || !task.deadline) continue;

        // Default task due reminder at 09:00 AM on the deadline day
        const deadlineAt = new Date(`${task.deadline}T09:00:00`);
        if (deadlineAt.getTime() <= nowTime + TWO_MINUTES_MS) continue;

        const priorityLabel = task.priority === 'high'
          ? (lang === 'am' ? 'ከፍተኛ ቅድሚያ' : 'High Priority')
          : (lang === 'am' ? 'ዛሬ ይጠናቀቃል' : 'Due Today');
        await sched({
          identifier: `task_deadline_${task.id}`,
          content: {
            title: lang === 'am' ? `ተግባር — ${priorityLabel}` : `Task — ${priorityLabel}`,
            body:  lang === 'am'
              ? `"${task.title}" ዛሬ ይጠናቀቃል።`
              : `"${task.title}" is due today.`,
            sound: true,
            data:  { taskId: task.id, type: 'task_deadline' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: deadlineAt,
            channelId: CH.DEADLINE.id,
          },
        });
      }
    }
  } catch (e) {
    console.warn('[Notif] performSyncAllNotifications error:', e);
  }
}

// ── Service Export ────────────────────────────
export const NotificationService = {

  // ── Request Permission + Setup Channels ──────
  configure: async (): Promise<boolean> => {
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let final = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        final = status;
      }
      if (final !== 'granted') {
        console.warn('[Notif] Permission not granted');
        return false;
      }
      await setupAndroidChannels();
      return true;
    } catch (e) {
      console.warn('[Notif] configure error:', e);
      return false;
    }
  },

  // ── Master Sync ───────────────────────────────
  // Call this any time settings / sessions / tasks change.
  syncAllNotifications: async (
    settings: AppSettings,
    sessions: StudySession[],
    tasks: Task[],
    todayFocusSeconds: number = 0,
  ): Promise<void> => {
    pendingArgs = { settings, sessions, tasks, todayFocusSeconds };
    await runSyncQueue();
  },

  // ── Sync from Stores (lazy require → no circular deps) ─
  syncFromStores: (): void => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useSettingsStore }  = require('../store/settingsStore')  as typeof import('../store/settingsStore');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useTimetableStore } = require('../store/timetableStore') as typeof import('../store/timetableStore');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useTaskStore }      = require('../store/taskStore')      as typeof import('../store/taskStore');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useFocusStore }     = require('../store/focusStore')     as typeof import('../store/focusStore');

      const settings = useSettingsStore.getState().settings;
      const sessions = useTimetableStore.getState().sessions;
      const tasks    = useTaskStore.getState().tasks;
      const todaySeconds = useFocusStore.getState().getTodayFocusSeconds();

      NotificationService.syncAllNotifications(settings, sessions, tasks, todaySeconds).catch(console.warn);
    } catch (e) {
      console.warn('[Notif] syncFromStores error:', e);
    }
  },

  // ── Schedule Focus Session End Notification ───
  // Returns the expo notification ID so it can be cancelled later.
  scheduleFocusEndNotification: async (
    secondsFromNow: number,
    lang: string = 'en',
    isBreak = false,
  ): Promise<string | null> => {
    try {
      if (secondsFromNow <= 0) return null;
      const fireAt = new Date(Date.now() + secondsFromNow * 1000);
      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'active_focus_timer_end',
        content: {
          title: isBreak
            ? (lang === 'am' ? 'ዕረፍት ተጠናቀቀ' : 'Break Complete')
            : (lang === 'am' ? 'ክፍለ ጊዜ ተጠናቀቀ' : 'Session Complete'),
          body: isBreak
            ? (lang === 'am' ? 'ቀጣዩን የትኩረት ክፍለ ጊዜ ይጀምሩ።' : 'Start your next focus session.')
            : (lang === 'am' ? 'ዕረፍትዎን ይጀምሩ።' : 'Start your break.'),
          sound: true,
          data: { type: 'focus_end' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId: CH.FOCUS.id,
        },
      });
      return id;
    } catch (e) {
      console.warn('[Notif] scheduleFocusEndNotification error:', e);
      return null;
    }
  },

  // ── Cancel One Notification ───────────────────
  cancelNotification: async (id: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn('[Notif] cancelNotification error:', e);
    }
  },

  // ── Cancel All ────────────────────────────────
  cancelAllReminders: async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('[Notif] cancelAllReminders error:', e);
    }
  },
};
