// ─────────────────────────────────────────────
// Armimo / አርምሞ — Constants
// ─────────────────────────────────────────────

import { SubjectKey } from '../types';

// ── App Info ──────────────────────────────────
export const APP_NAME = 'Armimo';
export const APP_NAME_AM = 'አርምሞ';
export const APP_VERSION = '1.0.0';

// ── Subjects ──────────────────────────────────
export interface SubjectConfig {
  key: SubjectKey;
  label: string;
  labelAm: string;
  color: string;
  icon: string; // MaterialCommunityIcons name
}

export const SUBJECTS: SubjectConfig[] = [
  { key: 'mathematics', label: 'Mathematics', labelAm: 'ሂሳብ', color: '#3B82F6', icon: 'function-variant' },
  { key: 'physics', label: 'Physics', labelAm: 'ፊዚክስ', color: '#8B5CF6', icon: 'atom' },
  { key: 'chemistry', label: 'Chemistry', labelAm: 'ኬሚስትሪ', color: '#10B981', icon: 'flask-outline' },
  { key: 'biology', label: 'Biology', labelAm: 'ባዮሎጂ', color: '#22C55E', icon: 'leaf-circle-outline' },
  { key: 'english', label: 'English', labelAm: 'እንግሊዝኛ', color: '#F59E0B', icon: 'book-alphabet' },
  { key: 'history', label: 'History', labelAm: 'ታሪክ', color: '#EF4444', icon: 'castle' },
  { key: 'geography', label: 'Geography', labelAm: 'ጂኦግራፊ', color: '#06B6D4', icon: 'earth' },
  { key: 'civics', label: 'Civics', labelAm: 'ሲቪክስ', color: '#F97316', icon: 'scale-balance' },
  { key: 'economics', label: 'Economics', labelAm: 'ኢኮኖሚክስ', color: '#84CC16', icon: 'chart-line' },
  { key: 'amharic', label: 'Amharic', labelAm: 'አማርኛ', color: '#EC4899', icon: 'translate' },
  { key: 'other', label: 'Other', labelAm: 'ሌላ', color: '#6B7280', icon: 'dots-horizontal' },
];

export const getSubject = (key: SubjectKey): SubjectConfig =>
  SUBJECTS.find((s) => s.key === key) ?? SUBJECTS[SUBJECTS.length - 1];

// ── Task Constants ─────────────────────────────
export const TASK_TYPES = [
  { key: 'revision', label: 'Revision', labelAm: 'ክለሳ', icon: 'refresh' },
  { key: 'assignment', label: 'Assignment', labelAm: 'ቤት ሥራ', icon: 'clipboard-text-outline' },
  { key: 'reading', label: 'Reading', labelAm: 'ንባብ', icon: 'book-open-outline' },
  { key: 'practice', label: 'Practice', labelAm: 'ልምምድ', icon: 'pencil-outline' },
  { key: 'memorization', label: 'Memorization', labelAm: 'ዝከሬ', icon: 'brain' },
] as const;

export const TASK_PRIORITIES = [
  { key: 'low', label: 'Low', labelAm: 'ዝቅተኛ', color: '#6B7280' },
  { key: 'medium', label: 'Medium', labelAm: 'መካከለኛ', color: '#F59E0B' },
  { key: 'high', label: 'High', labelAm: 'ከፍተኛ', color: '#EF4444' },
] as const;

export const DURATION_OPTIONS = [15, 20, 25, 30, 45, 60, 90, 120]; // minutes

// ── Focus Constants ────────────────────────────
export const FOCUS_MODES = [
  {
    key: 'pomodoro',
    label: 'Pomodoro',
    labelAm: 'ፖሞዶሮ',
    workMinutes: 25,
    breakMinutes: 5,
    icon: 'timer-outline',
    description: '25 min focus · 5 min break',
  },
  {
    key: 'deep',
    label: 'Deep Focus',
    labelAm: 'ጥልቅ ትኩረት',
    workMinutes: 90,
    breakMinutes: 15,
    icon: 'disc-outline',
    description: 'Long uninterrupted sessions',
  },
  {
    key: 'revision',
    label: 'Quick Revision',
    labelAm: 'ፈጣን ክለሳ',
    workMinutes: 15,
    breakMinutes: 5,
    icon: 'flash-outline',
    description: 'Short focused revision bursts',
  },
] as const;

export const AMBIENT_SOUNDS = [
  { key: 'rain', label: 'Rain', labelAm: 'ዝናብ', icon: 'rainy-outline', file: null },
  { key: 'wind', label: 'Wind', labelAm: 'ነፋስ', icon: 'cloud-outline', file: null },
  { key: 'whitenoise', label: 'White Noise', labelAm: 'ነጭ ድምፅ', icon: 'pulse-outline', file: null },
  { key: 'night', label: 'Night Ambience', labelAm: 'ምሽት ድምፅ', icon: 'moon-outline', file: null },
  { key: 'none', label: 'No Sound', labelAm: 'ድምፅ የለም', icon: 'volume-mute-outline', file: null },
] as const;

// ── Timetable Constants ────────────────────────
export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAYS_AM = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'];

export const STUDY_TYPES = [
  { key: 'deep', label: 'Deep Focus', labelAm: 'ጥልቅ ትኩረት', icon: 'disc-outline' },
  { key: 'revision', label: 'Revision', labelAm: 'ክለሳ', icon: 'refresh' },
  { key: 'reading', label: 'Reading', labelAm: 'ንባብ', icon: 'book-open-outline' },
  { key: 'practice', label: 'Practice', labelAm: 'ልምምድ', icon: 'pencil-outline' },
  { key: 'memorization', label: 'Memorization', labelAm: 'ዝከሬ', icon: 'brain' },
] as const;

// ── Notification Constants ─────────────────────
export const DEFAULT_REMINDER_MINUTES_BEFORE = 15;
export const DEFAULT_DAILY_REMINDER_TIME = '20:00';
export const DEFAULT_STREAK_REMINDER_TIME = '21:00';

// ── Analytics ─────────────────────────────────
export const HEATMAP_WEEKS = 12; // 84 days
export const DAILY_FOCUS_GOAL_HOURS_DEFAULT = 3;

// ── Storage Keys ──────────────────────────────
export const STORAGE_KEYS = {
  TASKS: '@armimo/tasks',
  FOCUS_SESSIONS: '@armimo/focus_sessions',
  FOCUS_STREAK: '@armimo/focus_streak',
  STUDY_SESSIONS: '@armimo/study_sessions',
  REMINDERS: '@armimo/reminders',
  SETTINGS: '@armimo/settings',
  ANALYTICS: '@armimo/analytics',
  DAILY_DATA: '@armimo/daily_data',
} as const;

// ── Motivational Strings ───────────────────────
export const MOTIVATIONAL_MESSAGES_EN = [
  'Small progress matters.',
  'Stay focused today.',
  'Consistency builds mastery.',
  'One session at a time.',
  'Discipline is freedom.',
  'Your future self is watching.',
  'Deep work creates deep results.',
  'Study now, succeed later.',
];

export const MOTIVATIONAL_MESSAGES_AM = [
  'ትንሽ እድገት ጠቃሚ ነው።',
  'ዛሬ ትኩረት ያድርጉ።',
  'ቁርጠኝነት ብቃትን ይፈጥራል።',
  'አንድ ክፍለ ጊዜ በአንዴ።',
  'ዲሲፕሊን ነፃነት ነው።',
];
