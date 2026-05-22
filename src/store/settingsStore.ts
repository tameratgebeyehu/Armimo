// ─────────────────────────────────────────────
// Armimo / አርምሞ — Settings Store (Zustand)
// ─────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, ThemeMode, LanguageCode, FocusMode } from '../types';
import {
  DEFAULT_DAILY_REMINDER_TIME,
  DEFAULT_REMINDER_MINUTES_BEFORE,
  DEFAULT_STREAK_REMINDER_TIME,
  DAILY_FOCUS_GOAL_HOURS_DEFAULT,
  STORAGE_KEYS,
} from '../constants';
import { NotificationService } from '../notifications/NotificationService';

// ── Default Settings ──────────────────────────
const defaultSettings: AppSettings = {
  themeMode: 'dark',
  language: 'en',
  useEthiopianTime: false,
  useEthiopianCalendar: false,
  defaultFocusMode: 'pomodoro',
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  pomodoroLongBreakMinutes: 20,
  pomodoroLongBreakInterval: 4,
  deepFocusMinutes: 90,
  revisionMinutes: 15,
  dailyFocusGoalHours: DAILY_FOCUS_GOAL_HOURS_DEFAULT,
  notifications: {
    enabled: true,
    studySessionReminders: true,
    focusReminders: true,
    deadlineReminders: true,
    streakReminders: true,
    dailyGoalReminders: true,
    reminderMinutesBefore: DEFAULT_REMINDER_MINUTES_BEFORE,
    dailyReminderTime: DEFAULT_DAILY_REMINDER_TIME,
    streakReminderTime: DEFAULT_STREAK_REMINDER_TIME,
  },
  onboardingCompleted: false,
};

// ── Store Interface ───────────────────────────
interface SettingsState {
  settings: AppSettings;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: LanguageCode) => void;
  setUseEthiopianTime: (value: boolean) => void;
  setUseEthiopianCalendar: (value: boolean) => void;
  setDefaultFocusMode: (mode: FocusMode) => void;
  setPomodoroWorkMinutes: (mins: number) => void;
  setPomodoroBreakMinutes: (mins: number) => void;
  setPomodoroLongBreakMinutes: (mins: number) => void;
  setPomodoroLongBreakInterval: (n: number) => void;
  setDeepFocusMinutes: (mins: number) => void;
  setRevisionMinutes: (mins: number) => void;
  setDailyFocusGoalHours: (hours: number) => void;
  setOnboardingCompleted: (value: boolean) => void;
  updateNotificationSettings: (updates: Partial<AppSettings['notifications']>) => void;
  resetSettings: () => void;
}

// ── Store ─────────────────────────────────────
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      setThemeMode: (mode) =>
        set((s) => ({ settings: { ...s.settings, themeMode: mode } })),

      setLanguage: (lang) =>
        set((s) => ({ settings: { ...s.settings, language: lang } })),

      setUseEthiopianTime: (value) =>
        set((s) => ({ settings: { ...s.settings, useEthiopianTime: value } })),

      setUseEthiopianCalendar: (value) =>
        set((s) => ({ settings: { ...s.settings, useEthiopianCalendar: value } })),

      setDefaultFocusMode: (mode) =>
        set((s) => ({ settings: { ...s.settings, defaultFocusMode: mode } })),

      setPomodoroWorkMinutes: (mins) =>
        set((s) => ({ settings: { ...s.settings, pomodoroWorkMinutes: mins } })),

      setPomodoroBreakMinutes: (mins) =>
        set((s) => ({ settings: { ...s.settings, pomodoroBreakMinutes: mins } })),

      setPomodoroLongBreakMinutes: (mins) =>
        set((s) => ({ settings: { ...s.settings, pomodoroLongBreakMinutes: mins } })),

      setPomodoroLongBreakInterval: (n) =>
        set((s) => ({ settings: { ...s.settings, pomodoroLongBreakInterval: n } })),

      setDeepFocusMinutes: (mins) =>
        set((s) => ({ settings: { ...s.settings, deepFocusMinutes: mins } })),

      setRevisionMinutes: (mins) =>
        set((s) => ({ settings: { ...s.settings, revisionMinutes: mins } })),

      setDailyFocusGoalHours: (hours) =>
        set((s) => ({ settings: { ...s.settings, dailyFocusGoalHours: hours } })),

      setOnboardingCompleted: (value) =>
        set((s) => ({ settings: { ...s.settings, onboardingCompleted: value } })),

      updateNotificationSettings: (updates) =>
        set((s) => {
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return {
            settings: {
              ...s.settings,
              notifications: { ...s.settings.notifications, ...updates },
            },
          };
        }),

      resetSettings: () => {
        set({ settings: defaultSettings });
        setTimeout(() => NotificationService.syncFromStores(), 0);
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
