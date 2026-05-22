// ─────────────────────────────────────────────
// Armimo / አርምሞ — Analytics Screen
// ─────────────────────────────────────────────

import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaWrapper } from '../../components/Layout';
import { AppText } from '../../components/AppText';
import { AppCard } from '../../components/AppCard';
import { AppDivider, AppChip, AppEmptyState, AppSectionHeader, AppBadge, AppProgressBar } from '../../components/AppUIKit';
import { AppModal } from '../../components/AppModal';
import { useTheme } from '../../theme/ThemeProvider';
import { useFocusStore } from '../../store/focusStore';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTimetableStore } from '../../store/timetableStore';
import { Spacing, Radius } from '../../theme/tokens';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getStrings } from '../../localization/strings';
import { SUBJECTS, getSubject } from '../../constants';
import { SubjectKey } from '../../types';
import { formatHours, toISODateString, getEthiopianDate, formatEthiopianDate, formatTimeString } from '../../utils/dateUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;

const formatGregorianDateLong = (date: Date, lang: 'en' | 'am' = 'en'): string => {
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsAm = ['ጃንዋሪ', 'ፌብሩዋሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር'];
  const weekdaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdaysAm = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'];

  const day = date.getDate();
  const monthIdx = date.getMonth();
  const year = date.getFullYear();
  const weekdayIdx = date.getDay();

  if (lang === 'am') {
    return `${weekdaysAm[weekdayIdx]}፣ ${monthsAm[monthIdx]} ${day} ቀን ${year} ዓ.ም`;
  } else {
    return `${weekdaysEn[weekdayIdx]}, ${monthsEn[monthIdx]} ${day}, ${year}`;
  }
};

export function AnalyticsScreen() {
  const { colors } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const lang = settings.language;
  const t = getStrings(lang);

  // States
  const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Stores
  const focusSessions = useFocusStore((s) => s.sessions);
  const streak = useFocusStore((s) => s.streak);
  const checkStreak = useFocusStore((s) => s.checkStreak);
  const tasks = useTaskStore((s) => s.tasks);
  const timetableSessions = useTimetableStore((s) => s.sessions);

  useEffect(() => {
    checkStreak();
  }, []);

  // ── Computations ────────────────────────────
  const stats = useMemo(() => {
    const activeFocus = focusSessions.filter((s) => s.completed || s.elapsed >= 60);
    const totalFocusSeconds = activeFocus.reduce((acc, s) => acc + s.elapsed, 0);
    const totalTasksCompleted = tasks.filter((t) => t.completed).length;
    const totalSessions = activeFocus.length;

    const avgSessionSeconds = totalSessions > 0 ? totalFocusSeconds / totalSessions : 0;
    const avgSessionMinutes = Math.round(avgSessionSeconds / 60);

    // Subject breakdown
    const subjectMap: Record<SubjectKey, number> = {} as any;
    activeFocus.forEach((s) => {
      const subj = s.subject ?? 'other';
      subjectMap[subj] = (subjectMap[subj] ?? 0) + s.elapsed;
    });

    const subjectBreakdownList = SUBJECTS.map((subj) => {
      const secs = subjectMap[subj.key] ?? 0;
      return {
        ...subj,
        seconds: secs,
        percentage: totalFocusSeconds > 0 ? secs / totalFocusSeconds : 0,
      };
    })
      .filter((s) => s.seconds > 0)
      .sort((a, b) => b.seconds - a.seconds);

    // Weekly consistency (percentage of days with study in the last 7 days)
    const activeDaysLastWeek = streak.weeklyData.filter((sec) => sec > 60).length;
    const consistency = Math.round((activeDaysLastWeek / 7) * 100);

    return {
      totalFocusSeconds,
      totalTasksCompleted,
      totalSessions,
      avgSessionMinutes,
      subjectBreakdownList,
      consistency,
    };
  }, [focusSessions, tasks, streak]);

  // ── Heatmap Grid (Last 53 Weeks = 371 Days) ────
  const heatmapData = useMemo(() => {
    // Generate dates for the last 371 days, aligned into 53 weeks of 7 days
    // Grid structure: 53 columns, 7 rows.
    // Row 0 = Sunday, Row 6 = Saturday.
    // We want the columns to be sequential weeks ending in today.
    
    // Map of YYYY-MM-DD to total study seconds (completed or in-progress)
    const densityMap: Record<string, number> = {};
    focusSessions.forEach((s) => {
      if (!s.elapsed || s.elapsed <= 0 || !s.startedAt) return;
      const d = new Date(s.startedAt);
      if (isNaN(d.getTime())) return;
      const dateStr = toISODateString(d);
      densityMap[dateStr] = (densityMap[dateStr] ?? 0) + s.elapsed;
    });

    const grid: { seconds: number; date: Date; level: number }[][] = Array.from({ length: 7 }, () => []);
    
    // Calculate start date (53 weeks ago, aligned to Sunday)
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const totalDaysToShow = 371; // 53 weeks * 7 days
    
    // gridEndDate is the Saturday of the current week
    const gridEndDate = new Date(today);
    gridEndDate.setDate(today.getDate() + (6 - currentDayOfWeek));

    // gridStartDate is Sunday of the week 53 weeks ago
    const gridStartDate = new Date(gridEndDate);
    gridStartDate.setDate(gridEndDate.getDate() - totalDaysToShow + 1);

    for (let col = 0; col < 53; col++) {
      for (let row = 0; row < 7; row++) {
        const index = col * 7 + row;
        const d = new Date(gridStartDate);
        d.setDate(gridStartDate.getDate() + index);
        
        const dateStr = toISODateString(d);
        const secs = densityMap[dateStr] ?? 0;
        
        // Define levels based on seconds (0 to 4)
        let level = 0;
        if (secs > 0 && secs < 900) level = 1;      // < 15 min
        else if (secs >= 900 && secs < 2700) level = 2;  // 15 - 45 min
        else if (secs >= 2700 && secs < 5400) level = 3;  // 45 - 90 min
        else if (secs >= 5400) level = 4;                 // > 90 min

        if (!grid[row]) {
          grid[row] = [];
        }
        grid[row]!.push({ seconds: secs, date: d, level });
      }
    }

    return grid;
  }, [focusSessions]);

  const hasData = stats.totalFocusSeconds > 0 || stats.totalTasksCompleted > 0;

  // Heatmap square color map
  const getLevelColor = (level: number) => {
    switch (level) {
      case 4: return colors.primary; // Intense study
      case 3: return colors.primary + 'B0';
      case 2: return colors.primary + '70';
      case 1: return colors.primary + '30';
      case 0:
      default: return colors.surface2; // No study
    }
  };

  const monthLabels = useMemo(() => {
    const labels: { text: string; colIdx: number }[] = [];
    let prevMonth = -1;
    for (let col = 0; col < 53; col++) {
      const dayData = heatmapData[0][col]; // Row 0 is Sunday
      if (dayData) {
        let monthName = '';
        if (settings.useEthiopianCalendar) {
          const ethDate = getEthiopianDate(dayData.date);
          const ethMonthsEn = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];
          const ethMonthsAm = ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];
          const m = ethDate.month;
          if (m !== prevMonth) {
            monthName = lang === 'am' ? ethMonthsAm[m - 1] : ethMonthsEn[m - 1];
            labels.push({ text: monthName, colIdx: col });
            prevMonth = m;
          }
        } else {
          const m = dayData.date.getMonth();
          if (m !== prevMonth) {
            const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthsAm = ['ጃን', 'ፌብ', 'ማር', 'ኤፕ', 'ሜይ', 'ጁን', 'ጁል', 'ኦገ', 'ሴፕ', 'ኦክ', 'ኖቬ', 'ዲሴ'];
            monthName = lang === 'am' ? monthsAm[m] : monthsEn[m];
            labels.push({ text: monthName, colIdx: col });
            prevMonth = m;
          }
        }
      }
    }
    return labels;
  }, [heatmapData, lang, settings.useEthiopianCalendar]);

  const handleDayClick = (day: { seconds: number; date: Date; level: number }) => {
    if (!day || !day.date) return;
    const targetDateStr = toISODateString(day.date);
    
    const daySessions = focusSessions.filter((s) => {
      if ((!s.completed && s.elapsed < 60) || !s.startedAt) return false;
      const d = new Date(s.startedAt);
      if (isNaN(d.getTime())) return false;
      return toISODateString(d) === targetDateStr;
    });

    const dayTasks = tasks.filter((t) => {
      if (!t.completed || !t.completionDate) return false;
      const d = new Date(t.completionDate);
      if (isNaN(d.getTime())) return false;
      return toISODateString(d) === targetDateStr;
    });

    const dayTimetableSessions = timetableSessions.filter((s) => {
      return (s.completedDates || []).includes(targetDateStr);
    });

    const daySubjectMap: Record<SubjectKey, number> = {} as any;
    daySessions.forEach((s) => {
      const subj = s.subject ?? 'other';
      daySubjectMap[subj] = (daySubjectMap[subj] ?? 0) + s.elapsed;
    });

    const daySubjectBreakdown = SUBJECTS.map((subj) => {
      const secs = daySubjectMap[subj.key] ?? 0;
      return {
        ...subj,
        seconds: secs,
      };
    }).filter((s) => s.seconds > 0);

    setSelectedDayDetail({
      date: day.date,
      level: day.level,
      seconds: day.seconds,
      sessions: daySessions,
      tasks: dayTasks,
      timetableSessions: dayTimetableSessions,
      subjects: daySubjectBreakdown,
    });
    setIsModalVisible(true);
  };

  return (
    <SafeAreaWrapper>
      {/* ── Header ──────────────────────── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
          <AppText variant="headline" color={colors.textPrimary}>
            {t.studyInsights}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
          {lang === 'am' ? 'የጥናት እድገትዎን እና ስታቲስቲክስዎን ይከታተሉ' : 'Analyze your local study metrics & streaks'}
        </AppText>
      </View>

      {!hasData ? (
        <ScrollView contentContainerStyle={styles.emptyScroll}>
          <AppEmptyState
            icon="bar-chart-outline"
            title={t.noDataYet}
            subtitle={t.startStudyingMessage}
            style={{ marginTop: Spacing.xl }}
          />
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
        >
          {/* ── Core Stat Grid ──────────────── */}
          <View style={styles.statGrid}>
            <AppCard style={styles.statCard}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <AppText variant="headline" color={colors.textPrimary} style={{ marginTop: Spacing.xs }}>
                {formatHours(stats.totalFocusSeconds)}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {t.totalFocusHours}
              </AppText>
            </AppCard>

            <AppCard style={styles.statCard}>
              <Ionicons name="checkbox" size={20} color={colors.accentGreen} />
              <AppText variant="headline" color={colors.textPrimary} style={{ marginTop: Spacing.xs }}>
                {stats.totalTasksCompleted}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {t.tasksCompleted}
              </AppText>
            </AppCard>

            <AppCard style={styles.statCard}>
              <Ionicons name="flame" size={20} color={colors.accentOrange} />
              <AppText variant="headline" color={colors.textPrimary} style={{ marginTop: Spacing.xs }}>
                {streak.currentStreak}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {t.currentStreak}
              </AppText>
            </AppCard>

            <AppCard style={styles.statCard}>
              <Ionicons name="pulse" size={20} color="#EC4899" />
              <AppText variant="headline" color={colors.textPrimary} style={{ marginTop: Spacing.xs }}>
                {stats.consistency}%
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {t.weeklyConsistency}
              </AppText>
            </AppCard>
          </View>

          {/* ── Activity Heatmap ────────────── */}
          <AppSectionHeader title={t.studyHeatmap} style={{ marginTop: Spacing.lg }} />
          <AppCard style={styles.heatmapCard}>
            <View style={{ flexDirection: 'row' }}>
              {/* Static Weekday Labels Column */}
              <View style={styles.staticRowLabelsColumn}>
                <View style={styles.rowLabelHeaderOffset} />
                <View style={styles.staticRowLabelCell} />
                <View style={styles.staticRowLabelCell}><AppText style={[styles.rowLabelText, { color: colors.textTertiary }]}>{lang === 'am' ? 'ሰኞ' : 'Mon'}</AppText></View>
                <View style={styles.staticRowLabelCell} />
                <View style={styles.staticRowLabelCell}><AppText style={[styles.rowLabelText, { color: colors.textTertiary }]}>{lang === 'am' ? 'ረቡ' : 'Wed'}</AppText></View>
                <View style={styles.staticRowLabelCell} />
                <View style={styles.staticRowLabelCell}><AppText style={[styles.rowLabelText, { color: colors.textTertiary }]}>{lang === 'am' ? 'አር' : 'Fri'}</AppText></View>
                <View style={styles.staticRowLabelCell} />
              </View>

              {/* Scrollable Month Labels and Grid */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: 10000, y: 0 }}
                contentContainerStyle={styles.heatmapScrollContainer}
              >
                <View style={{ flexDirection: 'column' }}>
                  {/* Month Labels Row */}
                  <View style={styles.monthLabelsRow}>
                    {Array.from({ length: 53 }).map((_, colIdx) => {
                      const label = monthLabels.find((l) => l.colIdx === colIdx);
                      return (
                        <View key={colIdx} style={styles.monthLabelCol}>
                          {label && (
                            <AppText style={[styles.monthLabelText, { color: colors.textTertiary }]} numberOfLines={1}>
                              {label.text}
                            </AppText>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Grid Container */}
                  <View style={styles.gridContainer}>
                    {heatmapData.map((row, rowIdx) => (
                      <View key={rowIdx} style={styles.heatmapRow}>
                        {row.map((day, colIdx) => (
                          <TouchableOpacity
                            key={colIdx}
                            onPress={() => handleDayClick(day)}
                            activeOpacity={0.7}
                            style={[
                              styles.heatmapSquare,
                              {
                                backgroundColor: getLevelColor(day.level),
                                borderRadius: Radius.xs,
                                borderColor: colors.border + '15',
                                borderWidth: 0.5,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>

            <AppDivider style={{ marginVertical: Spacing.md }} />

            {/* Heatmap Legend */}
            <View style={styles.legendRow}>
              <AppText variant="caption" color={colors.textTertiary}>Less</AppText>
              <View style={styles.legendSquares}>
                {[0, 1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.legendSquare,
                      { backgroundColor: getLevelColor(level), borderRadius: Radius.xs },
                    ]}
                  />
                ))}
              </View>
              <AppText variant="caption" color={colors.textTertiary}>More</AppText>
            </View>
          </AppCard>

          {/* ── Subject Breakdown ───────────── */}
          <AppSectionHeader title={t.subjectBreakdown} style={{ marginTop: Spacing.lg }} />
          <AppCard style={styles.subjectBreakdownCard}>
            <View style={{ gap: Spacing.md }}>
              {stats.subjectBreakdownList.map((subj) => (
                <View key={subj.key}>
                  <View style={styles.subjHeaderRow}>
                    <View style={styles.subjTitle}>
                      <View style={[styles.subjDot, { backgroundColor: subj.color }]} />
                      <AppText variant="bodyMedium" color={colors.textPrimary}>
                        {lang === 'am' ? subj.labelAm : subj.label}
                      </AppText>
                    </View>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {formatHours(subj.seconds)} ({Math.round(subj.percentage * 100)}%)
                    </AppText>
                  </View>
                  <AppProgressBar
                    progress={subj.percentage}
                    color={subj.color}
                    height={8}
                    style={{ marginTop: 6 }}
                  />
                </View>
              ))}
            </View>
          </AppCard>

          {/* ── Productivity Trends Card ────── */}
          <AppSectionHeader title={lang === 'am' ? 'የትኩረት ልምዶች' : 'Productivity Streaks'} style={{ marginTop: Spacing.lg }} />
          <AppCard style={{ marginBottom: Spacing.xl }}>
            <View style={styles.trendRow}>
              <View style={styles.trendItem}>
                <AppText variant="caption" color={colors.textTertiary}>
                  {lang === 'am' ? 'ምርጥ የትኩረት ቀናት' : 'Longest Streak'}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="flame" size={16} color={colors.accentOrange} />
                  <AppText variant="title" color={colors.accentOrange}>
                    {streak.longestStreak} {t.days}
                  </AppText>
                </View>
              </View>
              <View style={[styles.trendDivider, { backgroundColor: colors.border }]} />
              <View style={styles.trendItem}>
                <AppText variant="caption" color={colors.textTertiary}>
                  {lang === 'am' ? 'አማካይ የክፍለ ጊዜ ርዝመት' : 'Avg. Session Length'}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="timer-outline" size={16} color={colors.primary} />
                  <AppText variant="title" color={colors.primary}>
                    {stats.avgSessionMinutes} {t.minutes}
                  </AppText>
                </View>
              </View>
            </View>
          </AppCard>
        </ScrollView>
      )}

      {/* ── Day Details Modal ────────────── */}
      <AppModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={selectedDayDetail ? (
          settings.useEthiopianCalendar
            ? formatEthiopianDate(selectedDayDetail.date, lang)
            : formatGregorianDateLong(selectedDayDetail.date, lang)
        ) : ''}
        scrollable
      >
        {selectedDayDetail && (
          <View style={{ gap: Spacing.lg, paddingBottom: Spacing.xl }}>
            {/* Overview Summary */}
            <View style={styles.modalStatsRow}>
              <View style={[styles.modalStatCard, { backgroundColor: colors.surface2 }]}>
                <Ionicons name="time" size={22} color={colors.primary} />
                <AppText variant="title" color={colors.textPrimary} style={{ marginTop: Spacing.xs }}>
                  {formatHours(selectedDayDetail.seconds)}
                </AppText>
                <AppText variant="caption" color={colors.textTertiary}>
                  {t.totalFocusHours}
                </AppText>
              </View>

              <View style={[styles.modalStatCard, { backgroundColor: colors.surface2 }]}>
                <Ionicons name="flame" size={22} color={colors.accentOrange} />
                <AppText variant="title" color={colors.textPrimary} style={{ marginTop: Spacing.xs }}>
                  {selectedDayDetail.level} / 4
                </AppText>
                <AppText variant="caption" color={colors.textTertiary}>
                  {lang === 'am' ? 'የትኩረት ደረጃ' : 'Focus Level'}
                </AppText>
              </View>
            </View>

            {/* Subject Breakdown if any */}
            {selectedDayDetail.subjects.length > 0 && (
              <View>
                <AppSectionHeader title={lang === 'am' ? 'የዕለት የጥናት ስብጥር' : 'Daily Subject Breakdown'} />
                <AppCard style={{ padding: Spacing.md, backgroundColor: colors.surface2, borderWidth: 0 }}>
                  <View style={{ gap: Spacing.md }}>
                    {selectedDayDetail.subjects.map((subj: any) => {
                      const percentage = selectedDayDetail.seconds > 0 ? subj.seconds / selectedDayDetail.seconds : 0;
                      return (
                        <View key={subj.key}>
                          <View style={styles.subjHeaderRow}>
                            <View style={styles.subjTitle}>
                              <View style={[styles.subjDot, { backgroundColor: subj.color }]} />
                              <AppText variant="bodyMedium" color={colors.textPrimary}>
                                {lang === 'am' ? subj.labelAm : subj.label}
                              </AppText>
                            </View>
                            <AppText variant="caption" color={colors.textSecondary}>
                              {formatHours(subj.seconds)} ({Math.round(percentage * 100)}%)
                            </AppText>
                          </View>
                          <AppProgressBar
                            progress={percentage}
                            color={subj.color}
                            height={6}
                            style={{ marginTop: 4 }}
                          />
                        </View>
                      );
                    })}
                  </View>
                </AppCard>
              </View>
            )}

            {/* Focus Sessions list */}
            <View>
              <AppSectionHeader
                title={lang === 'am' ? 'የትኩረት ክፍለ ጊዜዎች' : 'Focus Sessions'}
                action={
                  selectedDayDetail.sessions.length > 0 ? (
                    <AppBadge label={`${selectedDayDetail.sessions.length}`} variant="neutral" />
                  ) : undefined
                }
              />
              {selectedDayDetail.sessions.length === 0 ? (
                <AppCard style={[styles.modalEmptyCard, { backgroundColor: colors.surface2 }]}>
                  <Ionicons name="timer-outline" size={28} color={colors.textTertiary} />
                  <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginTop: Spacing.xs }}>
                    {lang === 'am' ? 'በዚህ ቀን የተመዘገቡ ክፍለ ጊዜዎች የሉም' : 'No focus sessions recorded on this day.'}
                  </AppText>
                </AppCard>
              ) : (
                <View style={{ gap: Spacing.sm }}>
                  {selectedDayDetail.sessions.map((sess: any, index: number) => {
                    const subj = SUBJECTS.find(s => s.key === sess.subject) ?? { color: colors.primary, icon: 'book', label: 'Study', labelAm: 'ጥናት' };
                    const startDate = new Date(sess.startedAt);
                    const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
                    return (
                      <AppCard key={sess.id ?? index} style={[styles.modalSessionCard, { backgroundColor: colors.surface2 }]}>
                        <View style={[styles.subjDot, { backgroundColor: subj.color, marginRight: Spacing.sm }]} />
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMedium" color={colors.textPrimary} weight="semiBold">
                            {sess.title || (lang === 'am' ? subj.labelAm : subj.label)}
                          </AppText>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                              <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                              <AppText variant="caption" color={colors.textSecondary}>
                                {formatTimeString(timeStr, true, settings.useEthiopianTime)}
                              </AppText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                              <Ionicons name="hourglass-outline" size={12} color={colors.textTertiary} />
                              <AppText variant="caption" color={colors.textSecondary}>
                                {Math.round(sess.targetDuration / 60)} {t.minutes}
                              </AppText>
                            </View>
                          </View>
                        </View>
                        {sess.completed && (
                          <AppBadge label={lang === 'am' ? 'የተጠናቀቀ' : 'Completed'} variant="success" />
                        )}
                      </AppCard>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Tasks Completed list */}
            <View>
              <AppSectionHeader
                title={lang === 'am' ? 'የተጠናቀቁ ተግባራት' : 'Completed Tasks'}
                action={
                  selectedDayDetail.tasks.length > 0 ? (
                    <AppBadge label={`${selectedDayDetail.tasks.length}`} variant="success" />
                  ) : undefined
                }
              />
              {selectedDayDetail.tasks.length === 0 ? (
                <AppCard style={[styles.modalEmptyCard, { backgroundColor: colors.surface2 }]}>
                  <Ionicons name="checkmark-done" size={28} color={colors.textTertiary} />
                  <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginTop: Spacing.xs }}>
                    {lang === 'am' ? 'በዚህ ቀን የተጠናቀቁ ተግባራት የሉም' : 'No tasks completed on this day.'}
                  </AppText>
                </AppCard>
              ) : (
                <View style={{ gap: Spacing.sm }}>
                  {selectedDayDetail.tasks.map((task: any, index: number) => {
                    return (
                      <AppCard key={task.id ?? index} style={[styles.modalTaskCard, { backgroundColor: colors.surface2 }]}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.accentGreen} style={{ marginRight: Spacing.sm }} />
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMedium" color={colors.textPrimary} style={{ textDecorationLine: 'line-through', opacity: 0.7 }}>
                            {task.title}
                          </AppText>
                          <AppText variant="caption" color={colors.textTertiary}>
                            {lang === 'am' ? getSubject(task.subject).labelAm : getSubject(task.subject).label}
                          </AppText>
                        </View>
                      </AppCard>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Completed Timetable Sessions list */}
            <View>
              <AppSectionHeader
                title={lang === 'am' ? 'የተጠናቀቁ ክፍለ ጊዜዎች' : 'Completed Timetable Sessions'}
                action={
                  selectedDayDetail.timetableSessions && selectedDayDetail.timetableSessions.length > 0 ? (
                    <AppBadge label={`${selectedDayDetail.timetableSessions.length}`} variant="success" />
                  ) : undefined
                }
              />
              {!selectedDayDetail.timetableSessions || selectedDayDetail.timetableSessions.length === 0 ? (
                <AppCard style={[styles.modalEmptyCard, { backgroundColor: colors.surface2 }]}>
                  <Ionicons name="calendar-outline" size={28} color={colors.textTertiary} />
                  <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginTop: Spacing.xs }}>
                    {lang === 'am' ? 'በዚህ ቀን የተጠናቀቁ ክፍለ ጊዜዎች የሉም' : 'No study sessions completed on this day.'}
                  </AppText>
                </AppCard>
              ) : (
                <View style={{ gap: Spacing.sm }}>
                  {selectedDayDetail.timetableSessions.map((session: any, index: number) => {
                    const subj = SUBJECTS.find(s => s.key === session.subject) ?? { color: colors.primary, icon: 'book', label: 'Study', labelAm: 'ጥናት' };
                    return (
                      <AppCard key={session.id ?? index} style={[styles.modalTaskCard, { backgroundColor: colors.surface2 }]}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.accentGreen} style={{ marginRight: Spacing.sm }} />
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMedium" color={colors.textPrimary} style={{ opacity: 0.85 }}>
                            {session.title || (lang === 'am' ? subj.labelAm : subj.label)}
                          </AppText>
                          <AppText variant="caption" color={colors.textTertiary}>
                            {lang === 'am' ? subj.labelAm : subj.label} · {session.startTime} - {session.endTime}
                          </AppText>
                        </View>
                      </AppCard>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      </AppModal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  scrollBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  statCard: {
    width: (SCREEN_WIDTH - Spacing.md * 3) / 2, // 2 column layout
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  heatmapCard: {
    padding: Spacing.md,
  },
  staticRowLabelsColumn: {
    width: 32,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  rowLabelHeaderOffset: {
    height: 18,
  },
  staticRowLabelCell: {
    height: 25, // square size (22) + gap (3)
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rowLabelText: {
    fontSize: 9.5,
  },
  heatmapScrollContainer: {
    paddingRight: Spacing.xs,
  },
  monthLabelsRow: {
    flexDirection: 'row',
    height: 16,
    marginBottom: 2,
  },
  monthLabelCol: {
    width: 25, // square width (22) + gap (3)
    position: 'relative',
  },
  monthLabelText: {
    fontSize: 9,
    position: 'absolute',
    left: 0,
    width: 60,
    top: 0,
  },
  gridContainer: {
    flexDirection: 'column',
    gap: 3,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 3,
  },
  heatmapSquare: {
    width: 22,
    height: 22,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  legendSquares: {
    flexDirection: 'row',
    gap: 4,
  },
  legendSquare: {
    width: 14,
    height: 14,
  },
  subjectBreakdownCard: {
    padding: Spacing.md,
  },
  subjHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subjDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2D35',
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  modalStatCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalEmptyCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 0,
  },
  modalSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 0,
  },
  modalTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 0,
  },
});
