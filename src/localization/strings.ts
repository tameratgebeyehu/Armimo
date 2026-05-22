// ─────────────────────────────────────────────
// Armimo / አርምሞ — Localization (EN + AM)
// ─────────────────────────────────────────────

import { LanguageCode } from '../types';

export interface Strings {
  // Navigation
  home: string;
  tasks: string;
  focus: string;
  timetable: string;
  analytics: string;
  settings: string;

  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  close: string;
  confirm: string;
  done: string;
  next: string;
  back: string;
  loading: string;
  error: string;
  retry: string;
  today: string;
  tomorrow: string;
  yesterday: string;
  now: string;
  minutes: string;
  hours: string;

  // Home
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  todayOverview: string;
  dailyGoal: string;
  keepGoing: string;

  // Tasks
  myTasks: string;
  addTask: string;
  taskTitle: string;
  taskSubject: string;
  taskDescription: string;
  taskPriority: string;
  taskType: string;
  taskDeadline: string;
  taskDuration: string;
  taskNotes: string;
  noTasksToday: string;
  noTasksMessage: string;
  createFirstTask: string;
  filterToday: string;
  filterUpcoming: string;
  filterCompleted: string;
  filterOverdue: string;
  filterAll: string;
  searchTasks: string;
  deleteTask: string;
  deleteTaskConfirm: string;
  markComplete: string;
  markIncomplete: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;

  // Focus
  focusTimer: string;
  startFocus: string;
  pauseFocus: string;
  resumeFocus: string;
  stopFocus: string;
  resetFocus: string;
  sessionComplete: string;
  sessionCompleteMessage: string;
  pomodoro: string;
  deepFocus: string;
  quickRevision: string;
  selectSubject: string;
  ambientSound: string;
  noSound: string;
  todayFocusTime: string;
  currentStreak: string;
  longestStreak: string;
  days: string;
  recentSessions: string;
  noSessionsYet: string;
  startFirstSession: string;
  tapToAdjust: string;
  adjustTime: string;

  // Timetable
  myTimetable: string;
  addSession: string;
  sessionTitle: string;
  startTime: string;
  endTime: string;
  studyType: string;
  recurring: string;
  noSessionsScheduled: string;
  planYourWeek: string;
  upcoming: string;
  weeklyProgress: string;

  // Analytics
  studyInsights: string;
  totalFocusHours: string;
  tasksCompleted: string;
  sessionsCompleted: string;
  weeklyConsistency: string;
  studyHeatmap: string;
  subjectBreakdown: string;
  productivityTrends: string;
  noDataYet: string;
  startStudyingMessage: string;

  // Settings
  appearance: string;
  themeMode: string;
  lightMode: string;
  darkMode: string;
  amoledMode: string;
  language: string;
  ethiopianTime: string;
  ethiopianCalendar: string;
  focusDefaults: string;
  notificationSettings: string;
  dataManagement: string;
  clearAllData: string;
  clearDataConfirm: string;
  version: string;

  // Motivational
  smallProgressMatters: string;
  consistencyBuilds: string;
  disciplineIsFreedom: string;
  deepWorkCreates: string;

  // Onboarding
  onboardingWelcome: string;
  onboardingWelcomeDesc: string;
  onboardingChooseLang: string;
  onboardingChooseTheme: string;
  onboardingThemeLight: string;
  onboardingThemeDark: string;
  onboardingFocusTitle: string;
  onboardingFocusDesc: string;
  onboardingScheduleTitle: string;
  onboardingScheduleDesc: string;
  onboardingStreakTitle: string;
  onboardingStreakDesc: string;
  onboardingGoalTitle: string;
  onboardingGoalDesc: string;
  onboardingGetStarted: string;
  onboardingSkip: string;
}

// ── English Strings ───────────────────────────
const en: Strings = {
  // Navigation
  home: 'Home',
  tasks: 'Tasks',
  focus: 'Focus',
  timetable: 'Timetable',
  analytics: 'Analytics',
  settings: 'Settings',

  // Common
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  close: 'Close',
  confirm: 'Confirm',
  done: 'Done',
  next: 'Next',
  back: 'Back',
  loading: 'Loading...',
  error: 'Something went wrong',
  retry: 'Retry',
  today: 'Today',
  tomorrow: 'Tomorrow',
  yesterday: 'Yesterday',
  now: 'Now',
  minutes: 'min',
  hours: 'hrs',

  // Home
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
  todayOverview: "Today's Overview",
  dailyGoal: 'Daily Goal',
  keepGoing: 'Keep going',

  // Tasks
  myTasks: 'My Tasks',
  addTask: 'Add Task',
  taskTitle: 'Task Title',
  taskSubject: 'Subject',
  taskDescription: 'Description',
  taskPriority: 'Priority',
  taskType: 'Task Type',
  taskDeadline: 'Deadline',
  taskDuration: 'Duration',
  taskNotes: 'Notes',
  noTasksToday: 'No tasks today.',
  noTasksMessage: 'Your task list is clear.',
  createFirstTask: 'Create your first study mission.',
  filterToday: 'Today',
  filterUpcoming: 'Upcoming',
  filterCompleted: 'Completed',
  filterOverdue: 'Overdue',
  filterAll: 'All',
  searchTasks: 'Search tasks...',
  deleteTask: 'Delete Task',
  deleteTaskConfirm: 'Are you sure you want to delete this task?',
  markComplete: 'Mark Complete',
  markIncomplete: 'Mark Incomplete',
  priorityLow: 'Low',
  priorityMedium: 'Medium',
  priorityHigh: 'High',

  // Focus
  focusTimer: 'Focus Timer',
  startFocus: 'Start Session',
  pauseFocus: 'Pause',
  resumeFocus: 'Resume',
  stopFocus: 'Stop',
  resetFocus: 'Reset',
  sessionComplete: 'Session Complete',
  sessionCompleteMessage: 'Consistency builds mastery.',
  pomodoro: 'Pomodoro',
  deepFocus: 'Deep Focus',
  quickRevision: 'Quick Revision',
  selectSubject: 'Select Subject',
  ambientSound: 'Ambient Sound',
  noSound: 'No Sound',
  todayFocusTime: "Today's Focus",
  currentStreak: 'Current Streak',
  longestStreak: 'Best Streak',
  days: 'days',
  recentSessions: 'Recent Sessions',
  noSessionsYet: 'No sessions yet.',
  startFirstSession: 'Begin your first focus session.',
  tapToAdjust: 'Tap to adjust',
  adjustTime: 'Adjust Focus Time',

  // Timetable
  myTimetable: 'My Timetable',
  addSession: 'Add Session',
  sessionTitle: 'Session Title',
  startTime: 'Start Time',
  endTime: 'End Time',
  studyType: 'Study Type',
  recurring: 'Recurring',
  noSessionsScheduled: 'No sessions scheduled.',
  planYourWeek: 'Plan your study week.',
  upcoming: 'Upcoming',
  weeklyProgress: 'Weekly Progress',

  // Analytics
  studyInsights: 'Study Insights',
  totalFocusHours: 'Total Focus',
  tasksCompleted: 'Tasks Done',
  sessionsCompleted: 'Sessions',
  weeklyConsistency: 'Weekly Consistency',
  studyHeatmap: 'Activity Heatmap',
  subjectBreakdown: 'Subject Breakdown',
  productivityTrends: 'Trends',
  noDataYet: 'No data yet.',
  startStudyingMessage: 'Complete your first session to see insights.',

  // Settings
  appearance: 'Appearance',
  themeMode: 'Theme',
  lightMode: 'Light',
  darkMode: 'Dark',
  amoledMode: 'AMOLED Black',
  language: 'Language',
  ethiopianTime: 'Ethiopian Time',
  ethiopianCalendar: 'Ethiopian Calendar',
  focusDefaults: 'Focus Defaults',
  notificationSettings: 'Notifications',
  dataManagement: 'Data',
  clearAllData: 'Clear All Data',
  clearDataConfirm: 'This will permanently delete all your data. Are you sure?',
  version: 'Version',

  // Motivational
  smallProgressMatters: 'Small progress matters.',
  consistencyBuilds: 'Consistency builds mastery.',
  disciplineIsFreedom: 'Discipline is freedom.',
  deepWorkCreates: 'Deep work creates deep results.',

  // Onboarding
  onboardingWelcome: 'Welcome to Armimo',
  onboardingWelcomeDesc: 'Find your quiet focus. Cultivate deep study habits with a mindful Ethiopian calendar & pomodoro timer.',
  onboardingChooseLang: 'Choose Language',
  onboardingChooseTheme: 'Choose Theme',
  onboardingThemeLight: 'Light Mode',
  onboardingThemeDark: 'Dark Mode',
  onboardingFocusTitle: 'Deep Work & Pomodoro',
  onboardingFocusDesc: 'Choose Pomodoro, Deep Focus, or custom sessions. Get gentle ambient sounds to block distractions.',
  onboardingScheduleTitle: 'Structured Schedule',
  onboardingScheduleDesc: 'Organize tasks by priority and subject. Create recurring study events from Monday to Sunday.',
  onboardingStreakTitle: 'Track Your Consistency',
  onboardingStreakDesc: 'Earn streaks for studying daily. View your activity heatmap and study distribution breakdown over the year.',
  onboardingGoalTitle: 'Set Daily Focus Goal',
  onboardingGoalDesc: 'How many hours would you like to focus each day? You can change this later.',
  onboardingGetStarted: 'Get Started',
  onboardingSkip: 'Skip',
};

// ── Amharic Strings ───────────────────────────
const am: Strings = {
  ...en, // fallback to English for now
  // Navigation
  home: 'መነሻ',
  tasks: 'ተግባሮች',
  focus: 'ትኩረት',
  timetable: 'ሰዓት ሰሌዳ',
  analytics: 'ትንተና',
  settings: 'ቅንጅቶች',

  // Common
  save: 'አስቀምጥ',
  cancel: 'ሰርዝ',
  delete: 'ሰርዝ',
  edit: 'አርም',
  add: 'ጨምር',
  close: 'ዝጋ',
  confirm: 'አረጋግጥ',
  done: 'ተጠናቀቀ',
  today: 'ዛሬ',
  tomorrow: 'ነገ',
  now: 'አሁን',
  minutes: 'ደቂቃ',
  hours: 'ሰዓት',

  // Tasks
  myTasks: 'ተግባሮቼ',
  addTask: 'ተግባር ጨምር',
  noTasksToday: 'ዛሬ ምንም ተግባር የለም።',
  createFirstTask: 'የመጀመሪያ ጥናት ተልዕኮህን ፍጠር።',

  // Focus
  focusTimer: 'የትኩረት ሰዓት',
  startFocus: 'ክፍለ ጊዜ ጀምር',
  sessionComplete: 'ክፍለ ጊዜ ተጠናቀቀ',
  sessionCompleteMessage: 'ቁርጠኝነት ብቃትን ይፈጥራል።',
  todayFocusTime: 'የዛሬ ትኩረት',
  currentStreak: 'የአሁኑ ተከታታይ ቀናት',
  longestStreak: 'ምርጥ ተከታታይ ቀናት',
  days: 'ቀን',
  recentSessions: 'የቅርብ ጊዜ ክፍለ ጊዜያት',
  noSessionsYet: 'ምንም ክፍለ ጊዜ የለም',
  startFirstSession: 'የመጀመሪያ ክፍለ ጊዜዎን አሁን ይጀምሩ።',
  tapToAdjust: 'ለማስተካከል ይጫኑ',
  adjustTime: 'የትኩረት ጊዜ ያስተካክሉ',

  // Analytics
  studyInsights: 'ጥልቅ ትንተናዎች',
  totalFocusHours: 'ጠቅላላ ትኩረት',
  tasksCompleted: 'የተጠናቀቁ ተግባራት',
  sessionsCompleted: 'የክፍለ ጊዜያት ብዛት',
  weeklyConsistency: 'ሳምንታዊ ቀጣይነት',
  studyHeatmap: 'የእለት ተእለት እንቅስቃሴ ካርታ',
  subjectBreakdown: 'የትምህርት ክፍፍል',
  productivityTrends: 'ተከታታይ ቀናት እድገት',
  noDataYet: 'ምንም መረጃ የለም',
  startStudyingMessage: 'ትንተናዎችን ለማየት የመጀመሪያ ክፍለ ጊዜዎን ያጠናቅቁ።',

  // Motivational
  smallProgressMatters: 'ትንሽ እድገት ጠቃሚ ነው።',
  consistencyBuilds: 'ቁርጠኝነት ብቃትን ይፈጥራል።',
  disciplineIsFreedom: 'ዲሲፕሊን ነፃነት ነው።',
  deepWorkCreates: 'ጥልቅ ሥራ ጥልቅ ውጤት ይፈጥራል።',

  // Onboarding
  onboardingWelcome: 'እንኳን ወደ አርምሞ በሰላም መጡ',
  onboardingWelcomeDesc: 'ሰላማዊ ትኩረትን ያግኙ። ከኢትዮጵያ የቀን አቆጣጠር እና የትኩረት ሰዓት ጋር ጥልቅ የጥናት ልምዶችን ያዳብሩ።',
  onboardingChooseLang: 'ቋንቋ ይምረጡ',
  onboardingChooseTheme: 'ጭብጥ ይምረጡ',
  onboardingThemeLight: 'ብርሃን ጭብጥ',
  onboardingThemeDark: 'ጨለማ ጭብጥ',
  onboardingFocusTitle: 'ጥልቅ ሥራ እና ፖሞዶሮ',
  onboardingFocusDesc: 'የፖሞዶሮ ወይም የራስዎን ብጁ የትኩረት ሰዓቶች ይምረጡ። ረብሻዎችን ለመከላከል የሚያግዙ የተፈጥሮ ድምፆችን ያጫውቱ።',
  onboardingScheduleTitle: 'ስልታዊ የሰዓት ሰሌዳ',
  onboardingScheduleDesc: 'ተግባሮችዎን በትምህርት ዓይነት እና ቅድሚያ በሚሰጠው ደረጃ ያደራጁ። ከሰኞ እስከ እሁድ የሚደጋገሙ የጥናት ሰሌዳዎችን ይፍጠሩ።',
  onboardingStreakTitle: 'ቀጣይነትዎን ይከታተሉ',
  onboardingStreakDesc: 'በየቀኑ በማጥናት ተከታታይ ቀናትን (Streaks) ያስመዝግቡ። በዓመቱ ውስጥ ያለዎትን የእለት ተእለት እንቅስቃሴ ካርታ ይመልከቱ።',
  onboardingGoalTitle: 'የዕለት የትኩረት ግብ ያስቀምጡ',
  onboardingGoalDesc: 'በየቀኑ ስንት ሰዓት ማጥናት ይፈልጋሉ? ይህንን በኋላ ላይ መቀየር ይችላሉ።',
  onboardingGetStarted: 'ጀምር',
  onboardingSkip: 'አልፍ',
};

// ── Locale Map ─────────────────────────────────
const locales: Record<LanguageCode, Strings> = { en, am };

// ── Hook / Utility ────────────────────────────
export function getStrings(lang: LanguageCode): Strings {
  return locales[lang];
}

export function useStrings(lang: LanguageCode = 'en'): Strings {
  return locales[lang];
}
