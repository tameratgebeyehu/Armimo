// ─────────────────────────────────────────────
// Armimo / አርምሞ — Global Type Definitions
// ─────────────────────────────────────────────

// ── Theme ──────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'amoled';

// ── Language ───────────────────────────────────
export type LanguageCode = 'en' | 'am';

// ── Subjects ───────────────────────────────────
export type SubjectKey =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'english'
  | 'history'
  | 'geography'
  | 'civics'
  | 'economics'
  | 'amharic'
  | 'other';

// ── Task Types ─────────────────────────────────
export type TaskType = 'revision' | 'assignment' | 'reading' | 'practice' | 'memorization';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskFilter = 'today' | 'upcoming' | 'completed' | 'overdue' | 'all';

export interface Task {
  id: string;
  title: string;
  subject: SubjectKey;
  description?: string;
  priority: TaskPriority;
  estimatedDuration: number; // minutes
  deadline?: string; // ISO date string
  createdAt: string; // ISO date string
  completed: boolean;
  completionDate?: string; // ISO date string
  taskType: TaskType;
}

// ── Focus Session ──────────────────────────────
export type FocusMode = 'pomodoro' | 'deep' | 'revision';
export type TimerState = 'idle' | 'running' | 'paused' | 'completed' | 'break' | 'break_complete';

export interface FocusSession {
  id: string;
  mode: FocusMode;
  subject?: SubjectKey;
  targetDuration: number; // seconds
  elapsed: number; // seconds
  completed: boolean;
  startedAt: string; // ISO
  endedAt?: string; // ISO
  isBreak: boolean;
}

export interface FocusStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  totalFocusSeconds: number;
  weeklyData: number[]; // seconds per day, last 7 days
}

// ── Timetable ──────────────────────────────────
export type StudyType = 'deep' | 'revision' | 'reading' | 'practice' | 'memorization';
export type RecurringPattern = 'daily' | 'weekdays' | 'weekly' | 'none';

export interface StudySession {
  id: string;
  subject: SubjectKey;
  title: string;
  startTime: string; // HH:mm (24h)
  endTime: string;   // HH:mm (24h)
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  studyType: StudyType;
  notes?: string;
  isRecurring: boolean;
  recurringPattern: RecurringPattern;
  completed: boolean;
  completedDates?: string[];
  date?: string; // ISO date, for one-time sessions
  colorOverride?: string;
}

// ── Reminders ──────────────────────────────────
export type ReminderType =
  | 'study_session'
  | 'focus_session'
  | 'task_deadline'
  | 'streak'
  | 'daily_goal';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  body: string;
  scheduledTime: string; // ISO
  isRecurring: boolean;
  recurringDays?: number[]; // 0–6
  enabled: boolean;
  notificationId?: string; // Expo notification ID
  linkedEntityId?: string; // task/session ID
}

export interface NotificationSettings {
  enabled: boolean;
  studySessionReminders: boolean;
  focusReminders: boolean;
  deadlineReminders: boolean;
  streakReminders: boolean;
  dailyGoalReminders: boolean;
  reminderMinutesBefore: number; // e.g. 15
  dailyReminderTime: string; // HH:mm
  streakReminderTime: string; // HH:mm
}

// ── Analytics ──────────────────────────────────
export interface DailyStudyData {
  date: string; // ISO date (YYYY-MM-DD)
  focusSeconds: number;
  completedTasks: number;
  completedSessions: number;
  subjectBreakdown: Partial<Record<SubjectKey, number>>; // seconds per subject
}

export interface AnalyticsSummary {
  totalFocusHours: number;
  totalTasksCompleted: number;
  totalSessions: number;
  averageSessionMinutes: number;
  currentStreak: number;
  longestStreak: number;
  mostStudiedSubject?: SubjectKey;
  weeklyConsistency: number; // 0–100 %
  heatmapData: DailyStudyData[]; // last 84 days (12 weeks)
}

// ── Settings ───────────────────────────────────
export interface AppSettings {
  themeMode: ThemeMode;
  language: LanguageCode;
  useEthiopianTime: boolean;
  useEthiopianCalendar: boolean;
  defaultFocusMode: FocusMode;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroLongBreakInterval: number; // rounds before long break (default 4)
  deepFocusMinutes: number;
  revisionMinutes: number;
  dailyFocusGoalHours: number;
  notifications: NotificationSettings;
  onboardingCompleted: boolean;
}

// ── Navigation ─────────────────────────────────
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Focus: undefined;
  Timetable: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type TaskStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
};

export type FocusStackParamList = {
  FocusMain: undefined;
  FocusSession: { mode: FocusMode; subject?: SubjectKey };
};

export type TimetableStackParamList = {
  TimetableMain: undefined;
};

export type AnalyticsStackParamList = {
  AnalyticsMain: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  NotificationSettings: undefined;
};
