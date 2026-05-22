// ─────────────────────────────────────────────
// Armimo / አርምሞ — Focus Store (Zustand)
// ─────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusSession, FocusStreak, FocusMode, TimerState, SubjectKey } from '../types';
import { STORAGE_KEYS } from '../constants';
import { generateId, toISODateString, isToday } from '../utils/dateUtils';
import { NotificationService } from '../notifications/NotificationService';
import * as Haptics from 'expo-haptics';
import { AudioManager } from '../utils/AudioManager';

// ── Store Interface ───────────────────────────
interface FocusState {
  // Session history
  sessions: FocusSession[];

  // Active focus timer state
  activeSession: FocusSession | null;
  timerState: TimerState;
  selectedMode: FocusMode;
  selectedSubject: SubjectKey | null;
  ambientSound: string;

  // Notification tracking
  timerNotificationId: string | null;
  timerResumedAt: string | null; // ISO timestamp of when timer was last started/resumed

  // ── Pomodoro loop ──────────────────────────
  pomodoroRound: number;          // focus rounds completed since startSession chain began
  isBreakActive: boolean;
  breakTargetSeconds: number;
  breakElapsed: number;
  breakResumedAt: string | null;  // wall-clock anchor for background sync

  // Streak data
  streak: FocusStreak;

  // ── Timer actions ──────────────────────────
  startSession: (mode: FocusMode, targetSeconds: number, subject?: SubjectKey) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  completeSession: () => void;
  syncTimerFromBackground: () => void;

  // ── Break actions ──────────────────────────
  startBreak: (targetSeconds: number) => void;
  tickBreak: () => void;
  completeBreak: () => void;
  skipBreak: () => void;
  startNewRound: () => void;      // called from "Start Focus" after a break

  // ── Settings ──────────────────────────────
  setSelectedMode: (mode: FocusMode) => void;
  setSelectedSubject: (subject: SubjectKey | null) => void;
  setAmbientSound: (sound: string) => void;

  // ── Computed ──────────────────────────────
  getTodaySessions: () => FocusSession[];
  getTodayFocusSeconds: () => number;
  getWeeklyFocusSeconds: () => number[];

  // ── Data management ───────────────────────
  clearAllSessions: () => void;
  checkStreak: () => void;
  dismissCelebration: () => void;
}

// ── Helpers ───────────────────────────────────
const defaultStreak: FocusStreak = {
  currentStreak: 0,
  longestStreak: 0,
  totalFocusSeconds: 0,
  weeklyData: [0, 0, 0, 0, 0, 0, 0],
};

export function computeFocusStreak(
  sessions: FocusSession[],
  historicalLongestStreak = 0,
  historicalTotalFocusSeconds = 0
): FocusStreak {
  const activeSessions = sessions.filter(s => s.completed || s.elapsed >= 60);

  const calculatedTotalSeconds = activeSessions.reduce((sum, s) => sum + s.elapsed, 0);
  const totalFocusSeconds = Math.max(calculatedTotalSeconds, historicalTotalFocusSeconds);

  const dateSecondsMap: Record<string, number> = {};
  activeSessions.forEach(s => {
    if (!s.startedAt) return;
    const d = new Date(s.startedAt);
    if (isNaN(d.getTime())) return;
    const dateStr = toISODateString(d);
    dateSecondsMap[dateStr] = (dateSecondsMap[dateStr] ?? 0) + s.elapsed;
  });

  const sortedDates = Object.keys(dateSecondsMap).sort();

  const getOffsetDateString = (offsetDays: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return toISODateString(d);
  };

  const todayStr     = toISODateString(new Date());
  const yesterdayStr = getOffsetDateString(1);

  let currentStreak = 0;
  if (dateSecondsMap[todayStr] !== undefined || dateSecondsMap[yesterdayStr] !== undefined) {
    let checkDay = dateSecondsMap[todayStr] !== undefined ? 0 : 1;
    while (true) {
      const checkDateStr = getOffsetDateString(checkDay);
      if (dateSecondsMap[checkDateStr] !== undefined) {
        currentStreak++;
        checkDay++;
      } else {
        break;
      }
    }
  }

  let calculatedLongestStreak = 0;
  if (sortedDates.length > 0) {
    let tempStreak = 1;
    calculatedLongestStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]!);
      const currDate = new Date(sortedDates[i]!);
      const diffDays = Math.round(Math.abs(currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > calculatedLongestStreak) calculatedLongestStreak = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
  }

  const longestStreak = Math.max(calculatedLongestStreak, historicalLongestStreak);

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const dateStr = getOffsetDateString(i);
    return dateSecondsMap[dateStr] ?? 0;
  });

  const lastStudyDate = sortedDates[sortedDates.length - 1];

  return { currentStreak, longestStreak, lastStudyDate, totalFocusSeconds, weeklyData };
}

// ── Helper: get lang + settings from settings store ──
function getLang(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useSettingsStore } = require('../store/settingsStore') as typeof import('../store/settingsStore');
    return useSettingsStore.getState().settings.language ?? 'en';
  } catch {
    return 'en';
  }
}

function getBreakDuration(round: number): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useSettingsStore } = require('../store/settingsStore') as typeof import('../store/settingsStore');
    const s = useSettingsStore.getState().settings;
    const interval = s.pomodoroLongBreakInterval ?? 4;
    const isLong = round > 0 && round % interval === 0;
    return isLong
      ? (s.pomodoroLongBreakMinutes ?? 20) * 60
      : (s.pomodoroBreakMinutes ?? 5) * 60;
  } catch {
    return 5 * 60;
  }
}

// ── Store ─────────────────────────────────────
export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,
      timerState: 'idle',
      selectedMode: 'pomodoro',
      selectedSubject: null,
      ambientSound: 'none',
      streak: defaultStreak,
      timerNotificationId: null,
      timerResumedAt: null,

      // Break fields
      pomodoroRound: 0,
      isBreakActive: false,
      breakTargetSeconds: 0,
      breakElapsed: 0,
      breakResumedAt: null,

      // ── Focus timer ─────────────────────────
      startSession: (mode, targetSeconds, subject) => {
        const session: FocusSession = {
          id: generateId(),
          mode,
          subject,
          targetDuration: targetSeconds,
          elapsed: 0,
          completed: false,
          startedAt: new Date().toISOString(),
          isBreak: false,
        };
        set({
          activeSession: session,
          timerState: 'running',
          timerResumedAt: new Date().toISOString(),
          timerNotificationId: null,
          // Reset break state
          isBreakActive: false,
          breakElapsed: 0,
          breakTargetSeconds: 0,
          breakResumedAt: null,
        });

        // Start ambient sound if configured
        const sound = get().ambientSound;
        if (sound !== 'none') {
          AudioManager.play(sound).catch(console.warn);
        }

        // Schedule background notification
        const lang = getLang();
        NotificationService.scheduleFocusEndNotification(targetSeconds, lang, false)
          .then(id => { if (id) set({ timerNotificationId: id }); })
          .catch(console.warn);
      },

      pauseTimer: () => {
        const { timerNotificationId } = get();
        if (timerNotificationId) {
          NotificationService.cancelNotification(timerNotificationId).catch(console.warn);
        }
        set({ timerState: 'paused', timerNotificationId: null, timerResumedAt: null });
        AudioManager.pause().catch(console.warn);
      },

      resumeTimer: () => {
        const { activeSession } = get();
        if (!activeSession) return;
        const remaining = activeSession.targetDuration - activeSession.elapsed;
        set({ timerState: 'running', timerResumedAt: new Date().toISOString() });

        const sound = get().ambientSound;
        if (sound !== 'none') {
          AudioManager.resume().catch(console.warn);
        }

        const lang = getLang();
        NotificationService.scheduleFocusEndNotification(remaining, lang, false)
          .then(id => { if (id) set({ timerNotificationId: id }); })
          .catch(console.warn);
      },

      stopTimer: () => {
        const { activeSession, timerNotificationId } = get();
        if (timerNotificationId) {
          NotificationService.cancelNotification(timerNotificationId).catch(console.warn);
        }
        // Also cancel any active break notification
        NotificationService.cancelNotification('active_focus_timer_end').catch(console.warn);

        if (activeSession && activeSession.elapsed > 60) {
          const ended: FocusSession = {
            ...activeSession,
            endedAt: new Date().toISOString(),
            completed: false,
          };
          set((s) => {
            const newSessions = [ended, ...s.sessions].slice(0, 200);
            setTimeout(() => NotificationService.syncFromStores(), 0);
            return {
              sessions: newSessions,
              streak: computeFocusStreak(newSessions, s.streak.longestStreak, s.streak.totalFocusSeconds),
            };
          });
        }
        set({
          activeSession: null,
          timerState: 'idle',
          timerNotificationId: null,
          timerResumedAt: null,
          pomodoroRound: 0,
          isBreakActive: false,
          breakElapsed: 0,
          breakTargetSeconds: 0,
          breakResumedAt: null,
        });
        AudioManager.stop().catch(console.warn);
      },

      tickTimer: () => {
        const { activeSession, timerState } = get();
        if (!activeSession || timerState !== 'running') return;

        const newElapsed = activeSession.elapsed + 1;
        if (newElapsed >= activeSession.targetDuration) {
          get().completeSession();
          return;
        }
        set({ activeSession: { ...activeSession, elapsed: newElapsed } });
      },

      completeSession: () => {
        const { activeSession, pomodoroRound } = get();
        if (!activeSession) return;

        // Cancel the background notification (we're in the foreground)
        NotificationService.cancelNotification('active_focus_timer_end').catch(console.warn);
        AudioManager.stop().catch(console.warn);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(console.warn);

        const completed: FocusSession = {
          ...activeSession,
          elapsed: activeSession.targetDuration,
          completed: true,
          endedAt: new Date().toISOString(),
        };

        // Increment Pomodoro round counter only for pomodoro mode
        const newRound = activeSession.mode === 'pomodoro' ? pomodoroRound + 1 : pomodoroRound;
        // Pre-calculate break duration so the UI can show it immediately
        const breakSecs = getBreakDuration(newRound);

        set((s) => {
          const newSessions = [completed, ...s.sessions].slice(0, 200);
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return {
            sessions: newSessions,
            activeSession: null,
            timerState: 'completed',
            timerNotificationId: null,
            timerResumedAt: null,
            pomodoroRound: newRound,
            breakTargetSeconds: breakSecs,
            streak: computeFocusStreak(newSessions, s.streak.longestStreak, s.streak.totalFocusSeconds),
          };
        });
      },

      // ── Break actions ──────────────────────
      startBreak: (targetSeconds) => {
        set({
          timerState: 'break',
          isBreakActive: true,
          breakTargetSeconds: targetSeconds,
          breakElapsed: 0,
          breakResumedAt: new Date().toISOString(),
        });

        // Schedule a break-end notification
        const lang = getLang();
        NotificationService.scheduleFocusEndNotification(targetSeconds, lang, true)
          .then(id => { if (id) set({ timerNotificationId: id }); })
          .catch(console.warn);
      },

      tickBreak: () => {
        const { timerState, breakElapsed, breakTargetSeconds } = get();
        if (timerState !== 'break') return;

        const newElapsed = breakElapsed + 1;
        if (newElapsed >= breakTargetSeconds) {
          get().completeBreak();
          return;
        }
        set({ breakElapsed: newElapsed });
      },

      completeBreak: () => {
        const { timerNotificationId } = get();
        if (timerNotificationId) {
          NotificationService.cancelNotification(timerNotificationId).catch(console.warn);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(console.warn);
        set({
          timerState: 'break_complete',
          isBreakActive: false,
          breakResumedAt: null,
          timerNotificationId: null,
        });
      },

      skipBreak: () => {
        const { timerNotificationId } = get();
        if (timerNotificationId) {
          NotificationService.cancelNotification(timerNotificationId).catch(console.warn);
        }
        set({
          timerState: 'idle',
          isBreakActive: false,
          breakElapsed: 0,
          breakTargetSeconds: 0,
          breakResumedAt: null,
          timerNotificationId: null,
        });
      },

      startNewRound: () => {
        // Called from "Start Focus" button after a completed break
        const { selectedMode, selectedSubject } = get();
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { useSettingsStore } = require('../store/settingsStore') as typeof import('../store/settingsStore');
          const settings = useSettingsStore.getState().settings;
          let targetSeconds: number;
          switch (selectedMode) {
            case 'pomodoro': targetSeconds = settings.pomodoroWorkMinutes * 60; break;
            case 'deep':     targetSeconds = settings.deepFocusMinutes * 60; break;
            case 'revision': targetSeconds = settings.revisionMinutes * 60; break;
          }
          // Reset break_complete state first, then start
          set({ timerState: 'idle', breakElapsed: 0, isBreakActive: false });
          get().startSession(selectedMode, targetSeconds, selectedSubject ?? undefined);
        } catch (e) {
          console.warn('[FocusStore] startNewRound error:', e);
        }
      },

      // ── Background sync ─────────────────────
      syncTimerFromBackground: () => {
        const { activeSession, timerState, timerResumedAt, breakElapsed, breakTargetSeconds, breakResumedAt } = get();

        // Handle break background sync
        if (timerState === 'break' && breakResumedAt) {
          const secondsInBg = Math.floor((Date.now() - new Date(breakResumedAt).getTime()) / 1000);
          if (secondsInBg <= 1) return;
          const newBreakElapsed = breakElapsed + secondsInBg;
          if (newBreakElapsed >= breakTargetSeconds) {
            get().completeBreak();
          } else {
            set({ breakElapsed: newBreakElapsed, breakResumedAt: new Date().toISOString() });
          }
          return;
        }

        // Handle focus background sync
        if (!activeSession || timerState !== 'running' || !timerResumedAt) return;

        const secondsInBackground = Math.floor(
          (Date.now() - new Date(timerResumedAt).getTime()) / 1000
        );
        if (secondsInBackground <= 1) return;

        const newElapsed = activeSession.elapsed + secondsInBackground;

        if (newElapsed >= activeSession.targetDuration) {
          NotificationService.cancelNotification('active_focus_timer_end').catch(console.warn);
          AudioManager.stop().catch(console.warn);

          const completed: FocusSession = {
            ...activeSession,
            elapsed: activeSession.targetDuration,
            completed: true,
            endedAt: new Date().toISOString(),
          };
          const { pomodoroRound } = get();
          const newRound = activeSession.mode === 'pomodoro' ? pomodoroRound + 1 : pomodoroRound;
          const breakSecs = getBreakDuration(newRound);

          set((s) => {
            const newSessions = [completed, ...s.sessions].slice(0, 200);
            setTimeout(() => NotificationService.syncFromStores(), 0);
            return {
              sessions: newSessions,
              activeSession: null,
              timerState: 'completed',
              timerNotificationId: null,
              timerResumedAt: null,
              pomodoroRound: newRound,
              breakTargetSeconds: breakSecs,
              streak: computeFocusStreak(newSessions, s.streak.longestStreak, s.streak.totalFocusSeconds),
            };
          });
        } else {
          set({
            activeSession: { ...activeSession, elapsed: newElapsed },
            timerResumedAt: new Date().toISOString(),
          });
          setTimeout(() => NotificationService.syncFromStores(), 0);
        }
      },

      setSelectedMode: (mode) => set({ selectedMode: mode }),
      setSelectedSubject: (subject) => set({ selectedSubject: subject }),
      setAmbientSound: (sound) => {
        set({ ambientSound: sound });
        const { timerState } = get();
        if (timerState === 'running') {
          if (sound === 'none') {
            AudioManager.stop().catch(console.warn);
          } else {
            AudioManager.play(sound).catch(console.warn);
          }
        }
      },

      getTodaySessions: () => get().sessions.filter((s) => isToday(s.startedAt)),

      getTodayFocusSeconds: () =>
        get().getTodaySessions().reduce((acc, s) => acc + s.elapsed, 0),

      getWeeklyFocusSeconds: () => get().streak.weeklyData,

      clearAllSessions: () =>
        set({ sessions: [], streak: defaultStreak, activeSession: null, timerState: 'idle', pomodoroRound: 0 }),

      checkStreak: () => {
        const { sessions, streak } = get();
        const current = computeFocusStreak(sessions, streak.longestStreak, streak.totalFocusSeconds);
        if (
          current.currentStreak !== streak.currentStreak ||
          current.longestStreak !== streak.longestStreak ||
          current.totalFocusSeconds !== streak.totalFocusSeconds ||
          JSON.stringify(current.weeklyData) !== JSON.stringify(streak.weeklyData) ||
          current.lastStudyDate !== streak.lastStudyDate
        ) {
          set({ streak: current });
        }
      },

      dismissCelebration: () => {
        set({ timerState: 'idle' });
      },
    }),
    {
      name: STORAGE_KEYS.FOCUS_SESSIONS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        sessions:            s.sessions,
        streak:              s.streak,
        selectedMode:        s.selectedMode,
        selectedSubject:     s.selectedSubject,
        ambientSound:        s.ambientSound,
        activeSession:       s.activeSession,
        timerState:          s.timerState,
        timerNotificationId: s.timerNotificationId,
        timerResumedAt:      s.timerResumedAt,
        pomodoroRound:       s.pomodoroRound,
        isBreakActive:       s.isBreakActive,
        breakTargetSeconds:  s.breakTargetSeconds,
        breakElapsed:        s.breakElapsed,
        breakResumedAt:      s.breakResumedAt,
      }),
    }
  )
);
