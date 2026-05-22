// ─────────────────────────────────────────────
// Armimo / አርምሞ — Task Store (Zustand)
// ─────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskFilter, TaskPriority, SubjectKey, TaskType } from '../types';
import { STORAGE_KEYS } from '../constants';
import { generateId, toISODateString, isToday, isPast, isFuture } from '../utils/dateUtils';
import { NotificationService } from '../notifications/NotificationService';

// ── Store Interface ───────────────────────────
interface TaskState {
  tasks: Task[];
  activeFilter: TaskFilter;
  searchQuery: string;

  // CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;

  // Filters/Search
  setFilter: (filter: TaskFilter) => void;
  setSearchQuery: (query: string) => void;

  // Computed helpers
  getFilteredTasks: () => Task[];
  getTodayTasks: () => Task[];
  getCompletedCount: () => number;
  getTotalCount: () => number;
  getDailyProgress: () => number; // 0–1

  // Data management
  clearAllTasks: () => void;
}

// ── Store ─────────────────────────────────────
export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeFilter: 'today',
      searchQuery: '',

      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          completed: false,
        };
        set((s) => {
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return { tasks: [task, ...s.tasks] };
        });
      },

      updateTask: (id, updates) => {
        set((s) => {
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return {
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          };
        });
      },

      deleteTask: (id) => {
        set((s) => {
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return { tasks: s.tasks.filter((t) => t.id !== id) };
        });
      },

      toggleComplete: (id) => {
        set((s) => {
          setTimeout(() => NotificationService.syncFromStores(), 0);
          return {
            tasks: s.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    completed: !t.completed,
                    completionDate: !t.completed ? new Date().toISOString() : undefined,
                  }
                : t
            ),
          };
        });
      },

      setFilter: (filter) => set({ activeFilter: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      getFilteredTasks: () => {
        const { tasks, activeFilter, searchQuery } = get();
        const today = toISODateString(new Date());

        let filtered = tasks;

        // Apply search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.subject.toLowerCase().includes(q)
          );
        }

        // Apply filter
        switch (activeFilter) {
          case 'today':
            filtered = filtered.filter((t) => {
              if (!t.deadline) return isToday(t.createdAt);
              return isToday(t.deadline) || (isPast(t.deadline) && !t.completed);
            });
            break;
          case 'upcoming':
            filtered = filtered.filter(
              (t) => !t.completed && t.deadline && isFuture(t.deadline) && !isToday(t.deadline)
            );
            break;
          case 'completed':
            filtered = filtered.filter((t) => t.completed);
            break;
          case 'overdue':
            filtered = filtered.filter(
              (t) => !t.completed && t.deadline && isPast(t.deadline) && !isToday(t.deadline)
            );
            break;
          case 'all':
          default:
            break;
        }

        // Sort: incomplete first, then by priority
        return filtered.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      },

      getTodayTasks: () => {
        const { tasks } = get();
        return tasks.filter((t) => {
          if (!t.deadline) return isToday(t.createdAt);
          return isToday(t.deadline);
        });
      },

      getCompletedCount: () => {
        return get().getTodayTasks().filter((t) => t.completed).length;
      },

      getTotalCount: () => {
        return get().getTodayTasks().length;
      },

      getDailyProgress: () => {
        const total = get().getTotalCount();
        if (total === 0) return 0;
        return get().getCompletedCount() / total;
      },

      clearAllTasks: () => {
        set({ tasks: [] });
        setTimeout(() => NotificationService.syncFromStores(), 0);
      },
    }),
    {
      name: STORAGE_KEYS.TASKS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
