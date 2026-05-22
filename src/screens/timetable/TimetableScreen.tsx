// ─────────────────────────────────────────────
// Armimo / አርምሞ — Timetable Screen
// ─────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaWrapper } from '../../components/Layout';
import { AppText } from '../../components/AppText';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AppModal } from '../../components/AppModal';
import { AppDivider, AppChip, AppSwitch, AppEmptyState, AppSectionHeader, AppBadge, AppIconButton } from '../../components/AppUIKit';
import { AppConfirmDialog } from '../../components/AppConfirmDialog';
import { useTheme } from '../../theme/ThemeProvider';
import { useTimetableStore } from '../../store/timetableStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Spacing, Radius } from '../../theme/tokens';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getStrings } from '../../localization/strings';
import { SUBJECTS, STUDY_TYPES, WEEKDAYS_FULL_EN, WEEKDAYS_AM, getSubject } from '../../constants';
import { SubjectKey, StudyType, RecurringPattern } from '../../types';
import { formatTimeString, toEthiopianTime, formatEthiopianTime, ethiopianToGregorianTime, formatEthiopianDate, toISODateString } from '../../utils/dateUtils';

export function TimetableScreen() {
  const { colors } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const lang = settings.language;
  const t = getStrings(lang);

  // Timetable store
  const {
    sessions,
    selectedDayIndex,
    addSession,
    updateSession,
    deleteSession,
    toggleSessionComplete,
    setSelectedDay,
    getSessionsForDay,
    getWeeklyProgress,
  } = useTimetableStore();

  // Reset selected day to Today on mount
  useEffect(() => {
    setSelectedDay(new Date().getDay());
  }, [setSelectedDay]);

  // Modals & local state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('mathematics');
  const [selectedStudyType, setSelectedStudyType] = useState<StudyType>('deep');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Ethiopian time helper states
  const [ethStartVal, setEthStartVal] = useState('03:00');
  const [ethStartPeriod, setEthStartPeriod] = useState<'ቀን' | 'ምሽት'>('ቀን');
  const [ethEndVal, setEthEndVal] = useState('04:00');
  const [ethEndPeriod, setEthEndPeriod] = useState<'ቀን' | 'ምሽት'>('ቀን');

  const [isRecurring, setIsRecurring] = useState(true);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>('weekly');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Active day sessions
  const activeSessions = useMemo(() => {
    return getSessionsForDay(selectedDayIndex);
  }, [sessions, selectedDayIndex]);

  // Weekly progress
  const weeklyProgress = useMemo(() => {
    return getWeeklyProgress();
  }, [sessions]);

  // Render variables
  const weekdays = lang === 'am' ? WEEKDAYS_AM : WEEKDAYS_FULL_EN.map(w => w.slice(0, 3));
  const weekdaysOrder = [1, 2, 3, 4, 5, 6, 0]; // Start from Monday (1), end on Sunday (0)

  // Generate title if left empty by user
  const getGeneratedTitle = () => {
    const subj = SUBJECTS.find(s => s.key === selectedSubject);
    const type = STUDY_TYPES.find(t => t.key === selectedStudyType);
    if (lang === 'am') {
      const subjLabel = subj ? subj.labelAm : 'ጥናት';
      const typeLabel = type ? type.labelAm : '';
      return `${subjLabel} ${typeLabel}`.trim();
    } else {
      const subjLabel = subj ? subj.label : 'Study';
      const typeLabel = type ? type.label : '';
      return `${subjLabel} ${typeLabel}`.trim();
    }
  };

  const getSelectedDayDate = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const targetDayIndex = selectedDayIndex === 0 ? 7 : selectedDayIndex;
    const difference = targetDayIndex - currentDayOfWeek;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + difference);
    return targetDate;
  };

  const getSelectedDayDateString = () => {
    const targetDate = getSelectedDayDate();
    if (settings.useEthiopianCalendar) {
      return formatEthiopianDate(targetDate, lang);
    } else {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthsAm = [
        'ጃንዋሪ', 'ፌብሩዋሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን',
        'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር'
      ];
      const monthName = lang === 'am' ? monthsAm[targetDate.getMonth()] : months[targetDate.getMonth()];
      return lang === 'am'
        ? `${monthName} ${targetDate.getDate()} ቀን ${targetDate.getFullYear()} ዓ.ም`
        : `${monthName} ${targetDate.getDate()}, ${targetDate.getFullYear()}`;
    }
  };

  // Reset Form
  const resetForm = () => {
    setTitle('');
    setSelectedSubject('mathematics');
    setSelectedStudyType('deep');
    setStartTime('09:00');
    setEndTime('10:00');
    if (settings.useEthiopianTime) {
      setEthStartVal('03:00');
      setEthStartPeriod('ቀን');
      setEthEndVal('04:00');
      setEthEndPeriod('ቀን');
    }
    setIsRecurring(true);
    setRecurringPattern('weekly');
    setFormErrors({});
    setSelectedSessionId(null);
    setIsEditMode(false);
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (settings.useEthiopianTime) {
      const ethTimeRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)$/;
      if (!ethTimeRegex.test(ethStartVal)) {
        errors.startTime = lang === 'am' ? 'ትክክለኛ የኢትዮጵያ ሰዓት ያስገቡ (1-12:MM)' : 'Invalid Ethiopian time (1-12:MM)';
      }
      if (!ethTimeRegex.test(ethEndVal)) {
        errors.endTime = lang === 'am' ? 'ትክክለኛ የኢትዮጵያ ሰዓት ያስገቡ (1-12:MM)' : 'Invalid Ethiopian time (1-12:MM)';
      }
      if (ethTimeRegex.test(ethStartVal) && ethTimeRegex.test(ethEndVal)) {
        const [sh = 0, sm = 0] = ethStartVal.split(':').map(Number);
        const [eh = 0, em = 0] = ethEndVal.split(':').map(Number);
        const gregStart = ethiopianToGregorianTime(sh, sm, ethStartPeriod);
        const gregEnd = ethiopianToGregorianTime(eh, em, ethEndPeriod);
        const gregStartMin = gregStart.hour * 60 + gregStart.minute;
        const gregEndMin = gregEnd.hour * 60 + gregEnd.minute;
        if (gregStartMin >= gregEndMin) {
          errors.endTime = lang === 'am' ? 'የማጠናቀቂያ ሰዓት ከመጀመሪያው መቅደም አለበት' : 'End time must be after start time';
        }
      }
    } else {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(startTime)) {
        errors.startTime = lang === 'am' ? 'ትክክለኛ ሰዓት ያስገቡ (HH:MM)' : 'Invalid start time (HH:MM)';
      }
      if (!timeRegex.test(endTime)) {
        errors.endTime = lang === 'am' ? 'ትክክለኛ ሰዓት ያስገቡ (HH:MM)' : 'Invalid end time (HH:MM)';
      }
      if (startTime >= endTime && timeRegex.test(startTime) && timeRegex.test(endTime)) {
        errors.endTime = lang === 'am' ? 'የማጠናቀቂያ ሰዓት ከመጀመሪያው መቅደም አለበት' : 'End time must be after start time';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Session
  const handleSubmit = () => {
    if (!validateForm()) return;

    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (settings.useEthiopianTime) {
      const [sh = 0, sm = 0] = ethStartVal.split(':').map(Number);
      const [eh = 0, em = 0] = ethEndVal.split(':').map(Number);
      const gregStart = ethiopianToGregorianTime(sh, sm, ethStartPeriod);
      const gregEnd = ethiopianToGregorianTime(eh, em, ethEndPeriod);
      finalStartTime = `${String(gregStart.hour).padStart(2, '0')}:${String(gregStart.minute).padStart(2, '0')}`;
      finalEndTime = `${String(gregEnd.hour).padStart(2, '0')}:${String(gregEnd.minute).padStart(2, '0')}`;
    }

    const finalTitle = title.trim() || getGeneratedTitle();

    const sessionData = {
      title: finalTitle,
      subject: selectedSubject,
      studyType: selectedStudyType,
      startTime: finalStartTime,
      endTime: finalEndTime,
      dayOfWeek: selectedDayIndex,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : 'none' as RecurringPattern,
      date: isRecurring ? undefined : toISODateString(getSelectedDayDate()),
    };

    if (isEditMode && selectedSessionId) {
      updateSession(selectedSessionId, sessionData);
    } else {
      addSession(sessionData);
    }

    setIsAddModalVisible(false);
    resetForm();
  };

  // Open Edit Form
  const handleOpenEdit = (session: any) => {
    setSelectedSessionId(session.id);
    setTitle(session.title);
    setSelectedSubject(session.subject);
    setSelectedStudyType(session.studyType);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setIsRecurring(session.isRecurring);
    setRecurringPattern(session.recurringPattern === 'none' ? 'weekly' : session.recurringPattern);

    if (settings.useEthiopianTime) {
      const [sh = 0, sm = 0] = session.startTime.split(':').map(Number);
      const [eh = 0, em = 0] = session.endTime.split(':').map(Number);
      const ethStart = toEthiopianTime(sh, sm);
      const ethEnd = toEthiopianTime(eh, em);
      setEthStartVal(`${String(ethStart.hour).padStart(2, '0')}:${String(ethStart.minute).padStart(2, '0')}`);
      setEthStartPeriod(ethStart.period as 'ቀን' | 'ምሽት');
      setEthEndVal(`${String(ethEnd.hour).padStart(2, '0')}:${String(ethEnd.minute).padStart(2, '0')}`);
      setEthEndPeriod(ethEnd.period as 'ቀን' | 'ምሽት');
    }

    setIsEditMode(true);
    setIsAddModalVisible(true);
  };

  // Delete Confirm
  const handleDeleteConfirm = (id: string) => {
    setSessionToDelete(id);
  };

  return (
    <SafeAreaWrapper>
      {/* ── Header ──────────────────────── */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            <AppText variant="headline" color={colors.textPrimary}>
              {t.myTimetable}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
            {lang === 'am' ? 'ሳምንታዊ የጥናት ሰሌዳዎን ያደራጁ' : 'Structure your week for maximum output'}
          </AppText>
        </View>
        <AppButton
          label={t.add}
          variant="primary"
          size="sm"
          leftIcon={<Ionicons name="add-circle-outline" size={16} color={colors.textInverse} />}
          onPress={() => {
            resetForm();
            setIsAddModalVisible(true);
          }}
        />
      </View>

      {/* ── Calendar / Days Selector ────── */}
      <View style={[styles.daysSelectorContainer, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScroll}
        >
          {weekdaysOrder.map((idx) => {
            const day = weekdays[idx];
            const isSelected = selectedDayIndex === idx;
            const isToday = new Date().getDay() === idx;
            const hasSessions = sessions.some(s => s.dayOfWeek === idx);
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
                  setSelectedDay(idx);
                }}
                activeOpacity={0.7}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : isToday ? colors.primary : colors.border,
                    borderWidth: isToday ? 1.5 : 1,
                    borderRadius: Radius.md,
                  },
                ]}
              >
                <AppText
                  variant="label"
                  color={isSelected ? '#fff' : colors.textSecondary}
                  weight={isSelected ? 'bold' : 'medium'}
                >
                  {day}
                </AppText>
                {isToday && (
                  <AppText
                    style={{
                      fontSize: 9,
                      marginTop: 2,
                      fontWeight: 'bold',
                      color: isSelected ? '#fff' : colors.primary,
                    }}
                  >
                    {lang === 'am' ? 'ዛሬ' : 'Today'}
                  </AppText>
                )}
                {hasSessions && (
                  <View
                    style={[
                      styles.indicatorDot,
                      { backgroundColor: isSelected ? '#fff' : colors.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {/* ── Weekly Progress Card ────────── */}
        <AppCard style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium" color={colors.textPrimary}>
                {t.weeklyProgress}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
                {weeklyProgress.planned === 0
                  ? (lang === 'am' ? 'ገና ክፍለ ጊዜ አልታቀደም' : 'No sessions planned yet')
                  : (lang === 'am'
                      ? `ከ ${weeklyProgress.planned} ውስጥ ${weeklyProgress.completed} ክፍለ ጊዜ ተጠናቋል`
                      : `${weeklyProgress.completed} of ${weeklyProgress.planned} completed`
                    )}
              </AppText>
            </View>
            <View>
              <AppBadge
                label={
                  weeklyProgress.planned > 0
                    ? `${Math.round((weeklyProgress.completed / weeklyProgress.planned) * 100)}%`
                    : '0%'
                }
                variant={weeklyProgress.completed === weeklyProgress.planned && weeklyProgress.planned > 0 ? 'success' : 'primary'}
              />
            </View>
          </View>
        </AppCard>

        {/* ── Sessions List ───────────────── */}
        <AppSectionHeader
          title={lang === 'am' ? `${WEEKDAYS_AM[selectedDayIndex]} የጥናት ሰሌዳ (${getSelectedDayDateString()})` : `${WEEKDAYS_FULL_EN[selectedDayIndex]} Schedule (${getSelectedDayDateString()})`}
          action={
            activeSessions.length > 0 ? (
              <AppBadge label={lang === 'am' ? `${activeSessions.length} ንቁ` : `${activeSessions.length} active`} variant="neutral" />
            ) : undefined
          }
          style={{ marginTop: Spacing.md }}
        />

        {activeSessions.length === 0 ? (
          <AppEmptyState
            icon="calendar-outline"
            title={t.noSessionsScheduled}
            subtitle={t.planYourWeek}
            style={{ paddingVertical: Spacing.xxl }}
            action={
              <AppButton
                label={t.addSession}
                variant="secondary"
                size="sm"
                onPress={() => {
                  resetForm();
                  setIsAddModalVisible(true);
                }}
              />
            }
          />
        ) : (
          <View style={styles.sessionsList}>
            {activeSessions.map((session) => {
              const subj = getSubject(session.subject);
              const isCompleted = session.completed;
              const studyTypeInfo = STUDY_TYPES.find(st => st.key === session.studyType) ?? STUDY_TYPES[0]!;

              return (
                <AppCard
                  key={session.id}
                  style={[
                    styles.sessionCard,
                    isCompleted && { opacity: 0.65 },
                  ]}
                  onPress={() => handleOpenEdit(session)}
                >
                  {/* Subject accent bar */}
                  <View style={[styles.accentBar, { backgroundColor: subj.color }]} />

                  <View style={styles.sessionMain}>
                    <View style={styles.sessionInfo}>
                      <View style={styles.subjectRow}>
                        <View
                          style={[
                            styles.subjectIconBadge,
                            { backgroundColor: subj.color + '15' }
                          ]}
                        >
                          <MaterialCommunityIcons name={subj.icon as any} size={16} color={subj.color} />
                        </View>
                        <AppText
                          variant="bodyMedium"
                          color={subj.color}
                          weight="semiBold"
                        >
                          {lang === 'am' ? subj.labelAm : subj.label}
                        </AppText>
                        <AppText variant="caption" color={colors.textTertiary}>
                          · {lang === 'am' ? studyTypeInfo.labelAm : studyTypeInfo.label}
                        </AppText>
                      </View>

                      <AppText
                        variant="title"
                        color={colors.textPrimary}
                        style={[
                          styles.sessionTitleText,
                          isCompleted && { textDecorationLine: 'line-through', color: colors.textTertiary }
                        ]}
                        numberOfLines={1}
                      >
                        {session.title}
                      </AppText>

                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                        <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                          {formatTimeString(session.startTime, true, settings.useEthiopianTime)} - {formatTimeString(session.endTime, true, settings.useEthiopianTime)}
                        </AppText>
                        {session.isRecurring && (
                          <AppBadge
                            label={lang === 'am' ? 'ተደጋጋሚ' : 'Recurring'}
                            style={{ marginLeft: Spacing.sm }}
                            variant="neutral"
                          />
                        )}
                      </View>
                    </View>

                    {/* Completion checkbox & Delete */}
                    <View style={styles.sessionControls}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
                          toggleSessionComplete(session.id, toISODateString(getSelectedDayDate()));
                        }}
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isCompleted ? colors.accentGreen : colors.border,
                            backgroundColor: isCompleted ? colors.accentGreen : 'transparent',
                          },
                        ]}
                      >
                        {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </TouchableOpacity>

                      <AppIconButton
                        name="trash-outline"
                        color={colors.textTertiary}
                        onPress={() => handleDeleteConfirm(session.id)}
                        variant="ghost"
                        style={{ marginTop: Spacing.sm }}
                      />
                    </View>
                  </View>
                </AppCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── ADD/EDIT SESSION MODAL ──────── */}
      <AppModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        title={isEditMode ? (lang === 'am' ? 'ክፍለ ጊዜ አርም' : 'Edit Study Session') : t.addSession}
        scrollable
      >
        <View style={{ gap: Spacing.md }}>
            {/* Session Title */}
            <AppInput
              label={lang === 'am' ? `${t.sessionTitle} (ግዴታ ያልሆነ)` : `${t.sessionTitle} (Optional)`}
              placeholder={lang === 'am' ? 'ለምሳሌ፡ የክለሳ ጥናት' : 'e.g. Physics Mock Practice'}
              value={title}
              onChangeText={(txt) => {
                setTitle(txt);
                if (formErrors.title) {
                  setFormErrors(prev => ({ ...prev, title: '' }));
                }
              }}
              error={formErrors.title}
            />

            {/* Subject Picker */}
            <AppText variant="label" color={colors.textSecondary} style={{ marginTop: Spacing.md }}>
              {t.taskSubject}
            </AppText>
            <View style={styles.chipRow}>
              {SUBJECTS.map((subj) => {
                const isSelected = selectedSubject === subj.key;
                return (
                  <AppChip
                    key={subj.key}
                    label={lang === 'am' ? subj.labelAm : subj.label}
                    selected={isSelected}
                    color={subj.color}
                    onPress={() => setSelectedSubject(subj.key)}
                  />
                );
              })}
            </View>

            {/* Study Type Picker */}
            <AppText variant="label" color={colors.textSecondary} style={{ marginTop: Spacing.md }}>
              {t.studyType}
            </AppText>
            <View style={styles.chipRow}>
              {STUDY_TYPES.map((type) => {
                const isSelected = selectedStudyType === type.key;
                return (
                  <AppChip
                    key={type.key}
                    label={lang === 'am' ? type.labelAm : type.label}
                    selected={isSelected}
                    color={colors.primary}
                    onPress={() => setSelectedStudyType(type.key as StudyType)}
                  />
                );
              })}
            </View>

            {/* Time Pickers */}
            {/* Time Pickers */}
            {settings.useEthiopianTime ? (
              <View style={styles.timeInputsRow}>
                {/* Start Time Column */}
                <View style={{ flex: 1 }}>
                  <AppInput
                    label={lang === 'am' ? 'የመጀመሪያ ሰዓት (1-12)' : 'Start Time (1-12)'}
                    placeholder="03:00"
                    value={ethStartVal}
                    onChangeText={(txt) => {
                      setEthStartVal(txt);
                      if (formErrors.startTime) {
                        setFormErrors(prev => ({ ...prev, startTime: '' }));
                      }
                    }}
                    error={formErrors.startTime}
                    hint="e.g. 03:00"
                  />
                  <View style={[styles.chipRow, { marginTop: Spacing.xs }]}>
                    {(['ቀን', 'ምሽት'] as const).map((p) => (
                      <AppChip
                        key={p}
                        label={p === 'ቀን' ? (lang === 'am' ? 'ቀን' : 'Day') : (lang === 'am' ? 'ምሽት' : 'Night')}
                        selected={ethStartPeriod === p}
                        color={colors.primary}
                        onPress={() => {
                          setEthStartPeriod(p);
                          if (formErrors.startTime) {
                            setFormErrors(prev => ({ ...prev, startTime: '' }));
                          }
                        }}
                      />
                    ))}
                  </View>
                </View>

                <View style={{ width: Spacing.md }} />

                {/* End Time Column */}
                <View style={{ flex: 1 }}>
                  <AppInput
                    label={lang === 'am' ? 'የማጠናቀቂያ ሰዓት (1-12)' : 'End Time (1-12)'}
                    placeholder="04:00"
                    value={ethEndVal}
                    onChangeText={(txt) => {
                      setEthEndVal(txt);
                      if (formErrors.endTime) {
                        setFormErrors(prev => ({ ...prev, endTime: '' }));
                      }
                    }}
                    error={formErrors.endTime}
                    hint="e.g. 04:00"
                  />
                  <View style={[styles.chipRow, { marginTop: Spacing.xs }]}>
                    {(['ቀን', 'ምሽት'] as const).map((p) => (
                      <AppChip
                        key={p}
                        label={p === 'ቀን' ? (lang === 'am' ? 'ቀን' : 'Day') : (lang === 'am' ? 'ምሽት' : 'Night')}
                        selected={ethEndPeriod === p}
                        color={colors.primary}
                        onPress={() => {
                          setEthEndPeriod(p);
                          if (formErrors.endTime) {
                            setFormErrors(prev => ({ ...prev, endTime: '' }));
                          }
                        }}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.timeInputsRow}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label={t.startTime}
                    placeholder="09:00"
                    value={startTime}
                    onChangeText={(txt) => {
                      setStartTime(txt);
                      if (formErrors.startTime) {
                        setFormErrors(prev => ({ ...prev, startTime: '' }));
                      }
                    }}
                    error={formErrors.startTime}
                    hint="24h e.g. 14:30"
                  />
                </View>
                <View style={{ width: Spacing.md }} />
                <View style={{ flex: 1 }}>
                  <AppInput
                    label={t.endTime}
                    placeholder="10:30"
                    value={endTime}
                    onChangeText={(txt) => {
                      setEndTime(txt);
                      if (formErrors.endTime) {
                        setFormErrors(prev => ({ ...prev, endTime: '' }));
                      }
                    }}
                    error={formErrors.endTime}
                    hint="24h e.g. 16:00"
                  />
                </View>
              </View>
            )}

            {/* Recurrence Switch */}
            <AppSwitch
              value={isRecurring}
              onValueChange={setIsRecurring}
              label={t.recurring}
              hint={lang === 'am' ? 'በየሳምንቱ በዚህ ቀን ይደገም' : 'Repeat this session every week'}
              style={{ marginTop: Spacing.md }}
            />

            {isRecurring && (
              <View style={{ marginTop: Spacing.md }}>
                <AppText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.xs }}>
                  {lang === 'am' ? 'የመድገሚያ ዓይነት' : 'Repeat Interval'}
                </AppText>
                <View style={styles.chipRow}>
                  {(['weekly', 'daily', 'weekdays'] as RecurringPattern[]).map((pattern) => {
                    const isSelected = recurringPattern === pattern;
                    const labels: Record<string, string> = {
                      weekly: lang === 'am' ? 'በየሳምንቱ' : 'Weekly',
                      daily: lang === 'am' ? 'በየቀኑ' : 'Daily',
                      weekdays: lang === 'am' ? 'የሳምንት ቀናት' : 'Weekdays',
                    };
                    return (
                      <AppChip
                        key={pattern}
                        label={labels[pattern]!}
                        selected={isSelected}
                        color={colors.primary}
                        onPress={() => setRecurringPattern(pattern)}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            <AppDivider style={{ marginVertical: Spacing.lg }} />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <AppButton
                label={t.cancel}
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => setIsAddModalVisible(false)}
              />
              <View style={{ width: Spacing.md }} />
              <AppButton
                label={t.save}
                variant="primary"
                style={{ flex: 1 }}
                onPress={handleSubmit}
              />
            </View>
        </View>
      </AppModal>

      <AppConfirmDialog
        visible={!!sessionToDelete}
        title={lang === 'am' ? 'ክፍለ ጊዜ ሰርዝ' : 'Delete Session'}
        message={lang === 'am' ? 'ይህንን ጥናት ለመሰረዝ እርግጠኛ ነዎት?' : 'Are you sure you want to delete this study session?'}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        isDestructive
        onConfirm={() => {
          if (sessionToDelete) deleteSession(sessionToDelete);
          setSessionToDelete(null);
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  daysSelectorContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D35',
  },
  daysScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  dayBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 50,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  scrollBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  progressCard: {
    marginTop: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionsList: {
    gap: Spacing.md,
  },
  sessionCard: {
    paddingLeft: Spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  sessionMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitleText: {
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  sessionControls: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingBottom: Spacing.xxl,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  timeInputsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
  },
});
