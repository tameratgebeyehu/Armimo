// ─────────────────────────────────────────────
// Armimo / አርምሞ — Tasks Screen (Premium Redesign)
// ─────────────────────────────────────────────

import React, { useState, useRef, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, TextInput,
  Keyboard, LayoutAnimation, Platform, UIManager, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaWrapper } from '../../components/Layout';
import { AppText } from '../../components/AppText';
import { AppInput } from '../../components/AppInput';
import { AppCard } from '../../components/AppCard';
import {
  AppEmptyState,
  AppFloatingButton,
} from '../../components/AppUIKit';
import { AppModal } from '../../components/AppModal';
import { AppButton } from '../../components/AppButton';
import { AppConfirmDialog } from '../../components/AppConfirmDialog';
import { useTheme } from '../../theme/ThemeProvider';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getStrings } from '../../localization/strings';
import { Spacing, Radius, FontFamily, FontSize } from '../../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskFilter, TaskPriority, TaskType, SubjectKey } from '../../types';
import { SUBJECTS, TASK_TYPES, TASK_PRIORITIES, DURATION_OPTIONS } from '../../constants';
import { formatRelativeDate, isToday, isPast, isFuture } from '../../utils/dateUtils';

// ── Priority Badge ────────────────────────────
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { colors } = useTheme();
  const map = { high: colors.error, medium: colors.warning, low: colors.textTertiary };
  const labels = { high: 'HIGH', medium: 'MED', low: 'LOW' };
  return (
    <View style={[styles.priorityBadge, { backgroundColor: map[priority] + '22' }]}>
      <View style={[styles.priorityDot, { backgroundColor: map[priority] }]} />
      <AppText style={{ color: map[priority], fontSize: FontSize.xs, fontFamily: FontFamily.semiBold }}>
        {labels[priority]}
      </AppText>
    </View>
  );
}

// ── Task Card ─────────────────────────────────
function TaskCard({ task, onToggle, onPress, onDelete }: {
  task: Task;
  onToggle: () => void;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const subject = SUBJECTS.find((s) => s.key === task.subject);
  const subjectColor = subject?.color ?? '#6B7280';
  const isOverdue = !task.completed && task.deadline && isPast(task.deadline) && !isToday(task.deadline);

  return (
    <View
      style={[
        styles.taskCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          opacity: task.completed ? 0.62 : 1,
        },
      ]}
    >
      {/* Left accent bar by subject colour */}
      <View style={[styles.taskAccentBar, { backgroundColor: task.completed ? colors.border : subjectColor }]} />

      <View style={styles.taskCardInner}>
        {/* Completion toggle */}
        <TouchableOpacity
          onPress={onToggle}
          style={styles.checkButton}
          activeOpacity={0.7}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 10 }}
        >
          <View
            style={[
              styles.checkCircle,
              {
                borderColor: task.completed ? colors.accentGreen : subjectColor + '99',
                backgroundColor: task.completed ? colors.accentGreen : 'transparent',
              },
            ]}
          >
            {task.completed && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
        </TouchableOpacity>

        {/* Content */}
        <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.7}>
          <AppText
            variant="bodyMedium"
            color={task.completed ? colors.textTertiary : colors.textPrimary}
            style={[task.completed ? { textDecorationLine: 'line-through' } : {}, { lineHeight: 20 }]}
            numberOfLines={2}
          >
            {task.title}
          </AppText>

          <View style={styles.taskMeta}>
            {/* Subject pill */}
            <View style={[styles.subjectPill, { backgroundColor: subjectColor + '1A' }]}>
              <View style={[styles.subjectDot, { backgroundColor: subjectColor }]} />
              <AppText style={{ color: subjectColor, fontSize: 11, fontFamily: FontFamily.medium }}>
                {subject?.label ?? task.subject}
              </AppText>
            </View>

            <AppText variant="caption" color={colors.textTertiary}>
              {task.estimatedDuration}m
            </AppText>

            {task.deadline && (
              <View style={[
                styles.deadlineBadge,
                { backgroundColor: isOverdue ? colors.errorBg : (isToday(task.deadline) ? colors.warningBg : colors.surface2) }
              ]}>
                <Ionicons
                  name="time-outline"
                  size={10}
                  color={isOverdue ? colors.error : (isToday(task.deadline) ? colors.warning : colors.textTertiary)}
                />
                <AppText style={{
                  fontSize: 11,
                  fontFamily: FontFamily.medium,
                  color: isOverdue ? colors.error : (isToday(task.deadline) ? colors.warning : colors.textTertiary),
                  marginLeft: 3,
                }}>
                  {formatRelativeDate(task.deadline)}
                </AppText>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Right side: priority + delete */}
        <View style={styles.taskActions}>
          <PriorityBadge priority={task.priority} />
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.65}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={15} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Filter Tab ────────────────────────────────
function FilterTab({
  label, icon, count, active, onPress, activeColor,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  active: boolean;
  onPress: () => void;
  activeColor: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.filterTab,
        {
          backgroundColor: active ? activeColor : colors.surface2,
          borderColor: active ? activeColor : colors.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? '#fff' : colors.textSecondary}
        style={{ marginRight: 5 }}
      />
      <AppText style={{
        color: active ? '#fff' : colors.textSecondary,
        fontSize: FontSize.sm,
        fontFamily: active ? FontFamily.semiBold : FontFamily.medium,
      }}>
        {label}
      </AppText>
      {count > 0 && (
        <View style={[
          styles.filterCount,
          { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.surface3 }
        ]}>
          <AppText style={{
            fontSize: 10,
            fontFamily: FontFamily.semiBold,
            color: active ? '#fff' : colors.textSecondary,
          }}>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Create/Edit Task Form ─────────────────────
function TaskForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Task>;
  onSave: (data: Partial<Task>) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const lang = useSettingsStore((s) => s.settings.language);
  const t = getStrings(lang);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [subject, setSubject] = useState<SubjectKey>(initial?.subject ?? 'mathematics');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium');
  const [taskType, setTaskType] = useState<TaskType>(initial?.taskType ?? 'revision');
  const [duration, setDuration] = useState(initial?.estimatedDuration ?? 30);
  const [description, setDescription] = useState(initial?.description ?? '');

  const canSave = title.trim().length > 0;

  return (
    <View style={{ gap: Spacing.md }}>
      <AppInput
        label={lang === 'am' ? 'የተግባር ርዕስ *' : 'Task Title *'}
        value={title}
        onChangeText={setTitle}
        placeholder={lang === 'am' ? 'ምን ማጥናት ይፈልጋሉ?' : 'What do you need to study?'}
        autoFocus
      />

      {/* Subject */}
      <View>
        <AppText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
          {t.taskSubject}
        </AppText>
        <View style={styles.pillGrid}>
          {SUBJECTS.slice(0, 6).map((s) => (
            <TouchableOpacity
              key={s.key}
              onPress={() => setSubject(s.key)}
              style={[
                styles.selPill,
                {
                  backgroundColor: subject === s.key ? s.color + '22' : colors.surface2,
                  borderColor: subject === s.key ? s.color : colors.border,
                },
              ]}
            >
              <AppText
                style={{ color: subject === s.key ? s.color : colors.textSecondary, fontSize: FontSize.sm, fontFamily: FontFamily.medium }}
              >
                {lang === 'am' ? s.labelAm : s.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Priority */}
      <View>
        <AppText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
          {t.taskPriority}
        </AppText>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {TASK_PRIORITIES.map((p) => {
            const label = p.key === 'high' ? t.priorityHigh : p.key === 'medium' ? t.priorityMedium : t.priorityLow;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPriority(p.key as TaskPriority)}
                style={[
                  styles.selPill,
                  {
                    flex: 1,
                    backgroundColor: priority === p.key ? p.color + '22' : colors.surface2,
                    borderColor: priority === p.key ? p.color : colors.border,
                    justifyContent: 'center',
                  },
                ]}
              >
                <AppText style={{ color: priority === p.key ? p.color : colors.textSecondary, fontSize: FontSize.sm, fontFamily: FontFamily.medium, textAlign: 'center' }}>
                  {label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Duration */}
      <View>
        <AppText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
          {t.taskDuration}
        </AppText>
        <View style={styles.pillGrid}>
          {DURATION_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDuration(d)}
              style={[
                styles.selPill,
                {
                  backgroundColor: duration === d ? colors.primaryLight : colors.surface2,
                  borderColor: duration === d ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText style={{ color: duration === d ? colors.primary : colors.textSecondary, fontSize: FontSize.sm }}>
                {d}{t.minutes}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Task type */}
      <View>
        <AppText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
          {t.taskType}
        </AppText>
        <View style={styles.pillGrid}>
          {TASK_TYPES.map((tt) => {
            const label = lang === 'am' ? tt.labelAm : tt.label;
            return (
              <TouchableOpacity
                key={tt.key}
                onPress={() => setTaskType(tt.key as TaskType)}
                style={[
                  styles.selPill,
                  {
                    backgroundColor: taskType === tt.key ? colors.primaryLight : colors.surface2,
                    borderColor: taskType === tt.key ? colors.primary : colors.border,
                  },
                ]}
              >
                <AppText style={{ color: taskType === tt.key ? colors.primary : colors.textSecondary, fontSize: FontSize.sm }}>
                  {label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <AppInput
        label={lang === 'am' ? 'ማስታወሻ (ግዴታ ያልሆነ)' : 'Notes (optional)'}
        value={description}
        onChangeText={setDescription}
        placeholder={lang === 'am' ? 'ተጨማሪ ዝርዝሮች...' : 'Any extra details...'}
        multiline
        numberOfLines={3}
        style={{ height: 80, textAlignVertical: 'top' }}
      />

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
        <AppButton label={t.cancel} variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <AppButton
          label={lang === 'am' ? 'አስቀምጥ' : 'Save Task'}
          variant="primary"
          disabled={!canSave}
          onPress={() => onSave({ title, subject, priority, taskType, estimatedDuration: duration, description })}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

// ── Filter config ─────────────────────────────
type FilterConfig = {
  key: TaskFilter;
  labelEn: string;
  labelAm: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeColor: string;
};

// ── Main Tasks Screen ─────────────────────────
export function TasksScreen() {
  const { colors } = useTheme();
  const lang = useSettingsStore((s) => s.settings.language);
  const t = getStrings(lang);

  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  function openSearch() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchActive(true);
    setTimeout(() => { searchInputRef.current?.focus(); }, 120);
  }

  function closeSearch() {
    Keyboard.dismiss();
    setSearchQuery('');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchActive(false);
    setIsSearchFocused(false);
  }

  const tasks = useTaskStore((s) => s.tasks);
  const activeFilter = useTaskStore((s) => s.activeFilter);
  const searchQuery = useTaskStore((s) => s.searchQuery);
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks);
  const getCompletedCount = useTaskStore((s) => s.getCompletedCount);
  const getTotalCount = useTaskStore((s) => s.getTotalCount);
  const getDailyProgress = useTaskStore((s) => s.getDailyProgress);
  const { addTask, updateTask, deleteTask, toggleComplete, setFilter, setSearchQuery } = useTaskStore();

  const filteredTasks = getFilteredTasks();
  const completedToday = getCompletedCount();
  const totalToday = getTotalCount();
  const dailyProgress = getDailyProgress();

  // Per-filter counts
  const filterCounts = useMemo(() => ({
    all: tasks.length,
    today: tasks.filter((t) => {
      if (!t.deadline) return isToday(t.createdAt);
      return isToday(t.deadline) || (isPast(t.deadline) && !t.completed);
    }).length,
    completed: tasks.filter((t) => t.completed).length,
    upcoming: tasks.filter((t) => !t.completed && !!t.deadline && isFuture(t.deadline) && !isToday(t.deadline)).length,
    overdue: tasks.filter((t) => !t.completed && !!t.deadline && isPast(t.deadline) && !isToday(t.deadline)).length,
  }), [tasks]);

  // FILTERS ordered: Filter (All) → Today → Completed → Upcoming → Overdue
  const FILTERS: FilterConfig[] = [
    { key: 'all',       labelEn: 'Filter',    labelAm: 'ማጣሪያ',    icon: 'funnel-outline',            activeColor: colors.primary },
    { key: 'today',     labelEn: 'Today',     labelAm: 'ዛሬ',       icon: 'today-outline',            activeColor: '#0EA5E9' },
    { key: 'completed', labelEn: 'Completed', labelAm: 'የተጠናቀቁ', icon: 'checkmark-circle-outline', activeColor: colors.accentGreen },
    { key: 'upcoming',  labelEn: 'Upcoming',  labelAm: 'መጪ',       icon: 'calendar-outline',         activeColor: colors.accentOrange },
    { key: 'overdue',   labelEn: 'Overdue',   labelAm: 'የዘገዩ',     icon: 'alert-circle-outline',      activeColor: colors.error },
  ];

  function handleDelete(task: Task) { setTaskToDelete(task); }

  function handleSaveNew(data: Partial<Task>) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    addTask({
      title: data.title!,
      subject: data.subject!,
      description: data.description,
      priority: data.priority!,
      estimatedDuration: data.estimatedDuration!,
      taskType: data.taskType!,
    });
    setShowCreate(false);
  }

  function handleSaveEdit(data: Partial<Task>) {
    if (editingTask) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      updateTask(editingTask.id, data);
      setEditingTask(null);
    }
  }

  return (
    <SafeAreaWrapper>
      {/* ── Header ─────────────────────── */}
      <View style={styles.headerRow}>
        {isSearchActive ? (
          <View style={styles.searchContainerInsideHeader}>
            <TouchableOpacity onPress={closeSearch} style={styles.backBtnInsideHeader} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={[
              styles.searchInputBoxInsideHeader,
              {
                backgroundColor: colors.surface2,
                borderColor: isSearchFocused ? colors.primary : colors.inputBorder,
                borderWidth: isSearchFocused ? 1.5 : 1,
              },
            ]}>
              <Ionicons name="search" size={16} color={colors.textTertiary} style={{ marginRight: Spacing.sm }} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t.searchTasks}
                placeholderTextColor={colors.placeholder}
                style={[styles.searchNativeInput, { color: colors.textPrimary }]}
                returnKeyType="search"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                underlineColorAndroid="transparent"
                selectionColor={colors.primary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7} style={{ padding: 2 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.titleContainerInsideHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkbox-outline" size={20} color={colors.primary} />
                <AppText variant="headline" color={colors.textPrimary}>{t.myTasks}</AppText>
              </View>
              <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
                {completedToday}/{totalToday} {lang === 'am' ? 'ዛሬ ተጠናቅቋል' : 'done today'}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={openSearch}
              style={[styles.headerIconBtn, { backgroundColor: colors.surface2 }]}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Progress Card ──────────────── */}
      {totalToday > 0 && (
        <View style={styles.progressSection}>
          <AppCard style={styles.progressCardInsideTasks}>
            <View style={styles.progressCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={15} color={colors.accentGreen} />
                <AppText variant="bodyMedium" weight="semiBold" color={colors.textPrimary}>
                  {lang === 'am' ? 'የዛሬ እቅድ እድገት' : "Today's Task Progress"}
                </AppText>
              </View>
              <AppText variant="caption" weight="bold" color={colors.accentGreen}>
                {Math.round(dailyProgress * 100)}%
              </AppText>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.surface2, marginTop: Spacing.sm }]}>
              <View style={[styles.progressBarFill, { width: `${Math.round(dailyProgress * 100)}%`, backgroundColor: colors.accentGreen }]} />
            </View>
            <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 6 }}>
              {completedToday} {lang === 'am' ? 'ተግባራት ተጠናቀዋል' : 'tasks completed'} · {totalToday - completedToday} {lang === 'am' ? 'ቀሪ' : 'remaining'}
            </AppText>
          </AppCard>
        </View>
      )}

      {/* ── Filter tabs ────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <FilterTab
            key={f.key}
            label={lang === 'am' ? f.labelAm : f.labelEn}
            icon={f.icon}
            count={filterCounts[f.key]}
            active={activeFilter === f.key}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setFilter(f.key);
            }}
            activeColor={f.activeColor}
          />
        ))}
      </ScrollView>

      {/* ── Task list ──────────────────── */}
      {filteredTasks.length === 0 ? (
        <AppEmptyState
          icon={
            activeFilter === 'completed' ? 'checkmark-done-circle-outline' :
            activeFilter === 'overdue'   ? 'alarm-outline' :
            activeFilter === 'upcoming'  ? 'calendar-outline' :
            'clipboard-outline'
          }
          title={
            activeFilter === 'completed' ? (lang === 'am' ? 'ምንም የተጠናቀቀ ተግባር የለም' : 'No completed tasks yet') :
            activeFilter === 'overdue'   ? (lang === 'am' ? 'ምንም የዘገየ ተግባር የለም' : 'No overdue tasks') :
            activeFilter === 'upcoming'  ? (lang === 'am' ? 'ምንም መጪ ተግባር የለም' : 'No upcoming tasks') :
            t.noTasksToday
          }
          subtitle={activeFilter === 'all' || activeFilter === 'today' ? t.createFirstTask : undefined}
          action={
            activeFilter === 'all' || activeFilter === 'today' ? (
              <AppButton
                label={t.addTask}
                onPress={() => setShowCreate(true)}
                leftIcon={<Ionicons name="add" size={18} color="#fff" />}
              />
            ) : undefined
          }
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggle={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                toggleComplete(item.id);
              }}
              onPress={() => setDetailTask(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      {/* FAB */}
      <AppFloatingButton onPress={() => setShowCreate(true)} icon="add" />

      {/* Create Modal */}
      <AppModal visible={showCreate} onClose={() => setShowCreate(false)} title={t.addTask} scrollable>
        <TaskForm onSave={handleSaveNew} onClose={() => setShowCreate(false)} />
      </AppModal>

      {/* Detail Modal */}
      <AppModal
        visible={!!detailTask}
        onClose={() => setDetailTask(null)}
        title={lang === 'am' ? 'የተግባር ዝርዝር' : 'Task Details'}
        scrollable
      >
        {detailTask && (
          <View style={{ gap: Spacing.lg }}>
            <AppText variant="headline" color={colors.textPrimary}>{detailTask.title}</AppText>

            <View style={styles.detailGrid}>
              <View style={styles.detailGridItem}>
                <AppText variant="caption" color={colors.textTertiary}>{t.taskSubject}</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={[styles.subjectDot, { backgroundColor: SUBJECTS.find(s => s.key === detailTask.subject)?.color ?? '#6B7280' }]} />
                  <AppText variant="bodyMedium" color={colors.textPrimary}>
                    {lang === 'am' ? SUBJECTS.find(s => s.key === detailTask.subject)?.labelAm ?? detailTask.subject
                                   : SUBJECTS.find(s => s.key === detailTask.subject)?.label ?? detailTask.subject}
                  </AppText>
                </View>
              </View>
              <View style={styles.detailGridItem}>
                <AppText variant="caption" color={colors.textTertiary}>{t.taskPriority}</AppText>
                <View style={{ marginTop: 4 }}><PriorityBadge priority={detailTask.priority} /></View>
              </View>
              <View style={styles.detailGridItem}>
                <AppText variant="caption" color={colors.textTertiary}>{t.taskType}</AppText>
                <AppText variant="bodyMedium" color={colors.textPrimary} style={{ marginTop: 4 }}>
                  {lang === 'am' ? TASK_TYPES.find(tt => tt.key === detailTask.taskType)?.labelAm ?? detailTask.taskType
                                 : TASK_TYPES.find(tt => tt.key === detailTask.taskType)?.label ?? detailTask.taskType}
                </AppText>
              </View>
              <View style={styles.detailGridItem}>
                <AppText variant="caption" color={colors.textTertiary}>{t.taskDuration}</AppText>
                <AppText variant="bodyMedium" color={colors.textPrimary} style={{ marginTop: 4 }}>
                  {detailTask.estimatedDuration} {t.minutes}
                </AppText>
              </View>
            </View>

            <View style={[styles.notesContainer, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <AppText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.xs }}>
                {lang === 'am' ? 'ማስታወሻ' : 'Notes'}
              </AppText>
              <AppText variant="body" color={detailTask.description ? colors.textPrimary : colors.textTertiary}>
                {detailTask.description || (lang === 'am' ? 'ምንም ማስታወሻ አልተጻፈም' : 'No notes added for this task.')}
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <AppButton
                label={detailTask.completed ? (lang === 'am' ? 'ያልተጠናቀቀ አድርግ' : 'Mark Incomplete') : (lang === 'am' ? 'ተጠናቋል አድርግ' : 'Mark Completed')}
                variant={detailTask.completed ? 'secondary' : 'success'}
                leftIcon={<Ionicons name={detailTask.completed ? 'close-circle' : 'checkmark-circle'} size={18} color="#fff" />}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
                  toggleComplete(detailTask.id);
                  setDetailTask(prev => prev ? { ...prev, completed: !prev.completed } : null);
                }}
                style={{ flex: 1 }}
              />
              <AppButton
                label={lang === 'am' ? 'አርም' : 'Edit'}
                variant="primary"
                leftIcon={<Ionicons name="create-outline" size={18} color="#fff" />}
                onPress={() => { const te = detailTask; setDetailTask(null); setEditingTask(te); }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </AppModal>

      {/* Edit Modal */}
      <AppModal visible={!!editingTask} onClose={() => setEditingTask(null)} title={lang === 'am' ? 'ተግባር አርም' : 'Edit Task'} scrollable>
        {editingTask && (
          <TaskForm initial={editingTask} onSave={handleSaveEdit} onClose={() => setEditingTask(null)} />
        )}
      </AppModal>

      <AppConfirmDialog
        visible={!!taskToDelete}
        title={lang === 'am' ? 'ተግባር ሰርዝ' : 'Delete Task'}
        message={lang === 'am' ? `"${taskToDelete?.title}" ማጥፋት ይፈልጋሉ?` : `Delete "${taskToDelete?.title}"?`}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        isDestructive
        onConfirm={() => {
          if (taskToDelete) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            deleteTask(taskToDelete.id);
          }
          setTaskToDelete(null);
        }}
        onCancel={() => setTaskToDelete(null)}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    height: 72,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  titleContainerInsideHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchContainerInsideHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnInsideHeader: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginRight: Spacing.xs,
  },
  searchInputBoxInsideHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchNativeInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    paddingVertical: 0,
    paddingHorizontal: 6,
    height: '100%',
  },
  progressSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 5,
    borderRadius: 4,
  },
  filterScrollView: {
    flexGrow: 0,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingRight: Spacing.xl,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  filterCount: {
    marginLeft: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 110,
  },
  taskCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  taskAccentBar: {
    width: 4,
    borderRadius: 2,
    marginVertical: 6,
    marginLeft: 6,
  },
  taskCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingRight: Spacing.sm,
    paddingLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  checkButton: {
    padding: 4,
    marginLeft: 2,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  taskActions: {
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 2,
    minWidth: 50,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityDot: { width: 5, height: 5, borderRadius: 3 },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectDot: { width: 5, height: 5, borderRadius: 3 },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  selPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  detailGridItem: {
    width: '45%',
    minWidth: 130,
    marginBottom: Spacing.xs,
  },
  notesContainer: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  progressCardInsideTasks: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    padding: Spacing.md,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
