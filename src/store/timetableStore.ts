// ─────────────────────────────────────────────
// Armimo / አርምሞ — Timetable Store (Zustand)
// ─────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudySession, RecurringPattern, SubjectKey, StudyType } from '../types';
import { STORAGE_KEYS } from '../constants';
import { generateId, toISODateString } from '../utils/dateUtils';
import { NotificationService } from '../notifications/NotificationService';

interface TimetableState {
  sessions: StudySession[];
  selectedDayIndex: number; // 0–6

  addSession: (data: Omit<StudySession, 'id' | 'completed' | 'completedDates'>) => void;
  updateSession: (id: string, updates: Partial<StudySession>) => void;
  deleteSession: (id: string) => void;
  toggleSessionComplete: (id: string, dateStr: string) => void;
  setSelectedDay: (dayIndex: number) => void;

  getSessionsForDay: (dayIndex: number) => StudySession[];
  getUpcomingSessions: () => StudySession[];
  getWeeklyProgress: () => { planned: number; completed: number };

  clearAllSessions: () => void;
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
      sessions: [],
      selectedDayIndex: new Date().getDay(),

      addSession: (data) => {
        const session: StudySession = { ...data, id: generateId(), completed: false, completedDates: [] };
        set((s) => {
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return { sessions: [...s.sessions, session] };
        });
      },

      updateSession: (id, updates) => {
        set((s) => {
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return {
            sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...updates } : sess)),
          };
        });
      },

      deleteSession: (id) => {
        set((s) => {
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return { sessions: s.sessions.filter((sess) => sess.id !== id) };
        });
      },

      toggleSessionComplete: (id, dateStr) => {
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== id) return sess;
            const completedDates = sess.completedDates || [];
            const exists = completedDates.includes(dateStr);
            const newCompletedDates = exists
              ? completedDates.filter((d) => d !== dateStr)
              : [...completedDates, dateStr];
            return {
              ...sess,
              completedDates: newCompletedDates,
              completed: !exists,
            };
          }),
        }));
      },

      setSelectedDay: (dayIndex) => set({ selectedDayIndex: dayIndex }),

      getSessionsForDay: (dayIndex) => {
        const today = new Date();
        const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        const targetDayIndex = dayIndex === 0 ? 7 : dayIndex;
        const difference = targetDayIndex - currentDayOfWeek;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + difference);
        const dateStr = toISODateString(targetDate);

        return get()
          .sessions.filter((s) => {
            if (s.isRecurring) {
              if (s.recurringPattern === 'daily') return true;
              if (s.recurringPattern === 'weekdays') return dayIndex >= 1 && dayIndex <= 5;
              if (s.recurringPattern === 'weekly') return s.dayOfWeek === dayIndex;
            }
            if (s.date) {
              return s.date === dateStr;
            }
            return s.dayOfWeek === dayIndex;
          })
          .map((s) => {
            const completedDates = s.completedDates || [];
            const isCompleted = completedDates.includes(dateStr) || (!s.isRecurring && s.completed);
            return {
              ...s,
              completed: isCompleted,
            };
          })
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      },

      getUpcomingSessions: () => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const dateStr = toISODateString(now);
        return get()
          .sessions.filter((s) => {
            if (s.isRecurring && s.recurringPattern === 'daily') return s.startTime > currentTime;
            if (s.isRecurring && s.recurringPattern === 'weekdays') {
              return currentDay >= 1 && currentDay <= 5 && s.startTime > currentTime;
            }
            return s.dayOfWeek === currentDay && s.startTime > currentTime;
          })
          .map((s) => ({
            ...s,
            completed: (s.completedDates || []).includes(dateStr) || (!s.isRecurring && s.completed),
          }))
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .slice(0, 5);
      },

      getWeeklyProgress: () => {
        const sessions = get().sessions;
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        const mondayDiff = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
        
        const dates: { [dayIndex: number]: string } = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + mondayDiff + i);
          dates[d.getDay()] = toISODateString(d);
        }
        
        let plannedCount = 0;
        let completedCount = 0;
        
        sessions.forEach((s) => {
          if (s.isRecurring) {
            if (s.recurringPattern === 'daily') {
              plannedCount += 7;
              const completedDates = s.completedDates || [];
              Object.values(dates).forEach((dStr) => {
                if (completedDates.includes(dStr)) {
                  completedCount += 1;
                }
              });
            } else if (s.recurringPattern === 'weekdays') {
              plannedCount += 5;
              const completedDates = s.completedDates || [];
              [1, 2, 3, 4, 5].forEach((dayIdx) => {
                const dStr = dates[dayIdx];
                if (dStr && completedDates.includes(dStr)) {
                  completedCount += 1;
                }
              });
            } else if (s.recurringPattern === 'weekly') {
              plannedCount += 1;
              const completedDates = s.completedDates || [];
              const dStr = dates[s.dayOfWeek];
              if (dStr && completedDates.includes(dStr)) {
                completedCount += 1;
              }
            }
          } else {
            const dStr = s.date || dates[s.dayOfWeek];
            const weekDateStrings = Object.values(dates);
            if (weekDateStrings.includes(dStr)) {
              plannedCount += 1;
              const completedDates = s.completedDates || [];
              const isCompleted = completedDates.includes(dStr) || s.completed;
              if (isCompleted) {
                completedCount += 1;
              }
            }
          }
        });
        
        return {
          planned: plannedCount,
          completed: completedCount,
        };
      },

      clearAllSessions: () => {
        set({ sessions: [] });
        setTimeout(() => NotificationService.syncFromStores(), 0);
      },
    }),
    {
      name: STORAGE_KEYS.STUDY_SESSIONS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ sessions: state.sessions }),
    }
  )
);
