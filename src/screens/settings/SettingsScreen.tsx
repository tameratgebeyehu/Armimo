// ─────────────────────────────────────────────
// Armimo / አርምሞ — Settings Screen
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaWrapper } from '../../components/Layout';
import { AppText } from '../../components/AppText';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AppDivider, AppChip, AppSwitch, AppSectionHeader } from '../../components/AppUIKit';
import { AppConfirmDialog } from '../../components/AppConfirmDialog';
import { useTheme } from '../../theme/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { useFocusStore } from '../../store/focusStore';
import { useTaskStore } from '../../store/taskStore';
import { useTimetableStore } from '../../store/timetableStore';
import { Spacing, Radius } from '../../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { getStrings } from '../../localization/strings';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../types';
import { APP_VERSION, APP_NAME, APP_NAME_AM } from '../../constants';

type SettingsNavProp = StackNavigationProp<SettingsStackParamList, 'SettingsMain'>;

export function SettingsScreen() {
  const { colors, setTheme } = useTheme();
  const navigation = useNavigation<SettingsNavProp>();

  // Settings store
  const {
    settings,
    setThemeMode,
    setLanguage,
    setUseEthiopianTime,
    setUseEthiopianCalendar,
    setDefaultFocusMode,
    setPomodoroWorkMinutes,
    setPomodoroBreakMinutes,
    setDeepFocusMinutes,
    setRevisionMinutes,
    setDailyFocusGoalHours,
    setOnboardingCompleted,
    resetSettings,
  } = useSettingsStore();

  const t = getStrings(settings.language);

  // Clear data stores
  const clearFocusSessions = useFocusStore((s) => s.clearAllSessions);
  const clearTasks = useTaskStore((s) => s.clearAllTasks);
  const clearSessions = useTimetableStore((s) => s.clearAllSessions);

  // Local form state for custom timers
  const [pomodoroWork, setPomodoroWork] = useState(String(settings.pomodoroWorkMinutes));
  const [pomodoroBreak, setPomodoroBreak] = useState(String(settings.pomodoroBreakMinutes));
  const [deepFocus, setDeepFocus] = useState(String(settings.deepFocusMinutes));
  const [dailyGoal, setDailyGoal] = useState(String(settings.dailyFocusGoalHours));

  // Validation parsed numbers
  const parsedWork = parseInt(pomodoroWork, 10);
  const parsedBreak = parseInt(pomodoroBreak, 10);
  const parsedDeep = parseInt(deepFocus, 10);
  const parsedGoal = parseInt(dailyGoal, 10);

  // Field validations
  const isWorkInvalid = pomodoroWork.trim() !== '' && (isNaN(parsedWork) || parsedWork <= 0 || parsedWork > 180);
  const isBreakInvalid = pomodoroBreak.trim() !== '' && (isNaN(parsedBreak) || parsedBreak <= 0 || parsedBreak > 60);
  const isDeepInvalid = deepFocus.trim() !== '' && (isNaN(parsedDeep) || parsedDeep <= 0 || parsedDeep > 300);
  const isGoalInvalid = dailyGoal.trim() !== '' && (isNaN(parsedGoal) || parsedGoal <= 0 || parsedGoal > 24);

  const hasValidationError =
    isWorkInvalid || isBreakInvalid || isDeepInvalid || isGoalInvalid ||
    pomodoroWork.trim() === '' || pomodoroBreak.trim() === '' || deepFocus.trim() === '' || dailyGoal.trim() === '';

  const hasChanges =
    pomodoroWork !== String(settings.pomodoroWorkMinutes) ||
    pomodoroBreak !== String(settings.pomodoroBreakMinutes) ||
    deepFocus !== String(settings.deepFocusMinutes) ||
    dailyGoal !== String(settings.dailyFocusGoalHours);

  // Custom Alert / Confirm Modal Config
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    isDestructive?: boolean;
    alertMode?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Save Focus Defaults to Store
  const handleSaveFocusDefaults = () => {
    if (hasValidationError) return;
    
    setPomodoroWorkMinutes(parsedWork);
    setPomodoroBreakMinutes(parsedBreak);
    setDeepFocusMinutes(parsedDeep);
    setDailyFocusGoalHours(parsedGoal);

    setDialogConfig({
      visible: true,
      title: settings.language === 'am' ? 'ለውጦች ተቀምጠዋል' : 'Settings Saved',
      message: settings.language === 'am' ? 'የጥናት ምርጫዎችዎ በተሳካ ሁኔታ ተቀምጠዋል።' : 'Your default focus timer settings have been saved.',
      confirmLabel: settings.language === 'am' ? 'እሺ' : 'OK',
      onConfirm: () => {},
      alertMode: true,
      icon: 'checkmark-circle-outline',
      iconColor: colors.success,
    });
  };

  // Clear All Local Data
  const handleClearAllData = () => {
    setDialogConfig({
      visible: true,
      title: t.clearAllData,
      message: t.clearDataConfirm,
      confirmLabel: settings.language === 'am' ? 'አጥፋ' : 'Delete',
      cancelLabel: t.cancel,
      isDestructive: true,
      onConfirm: () => {
        clearFocusSessions();
        clearTasks();
        clearSessions();
        resetSettings();
        
        // Sync UI states with latest store values
        const freshSettings = useSettingsStore.getState().settings;
        setPomodoroWork(String(freshSettings.pomodoroWorkMinutes));
        setPomodoroBreak(String(freshSettings.pomodoroBreakMinutes));
        setDeepFocus(String(freshSettings.deepFocusMinutes));
        setDailyGoal(String(freshSettings.dailyFocusGoalHours));
        
        // Slightly delayed to avoid animation collision during modal dismiss
        setTimeout(() => {
          setDialogConfig({
            visible: true,
            title: settings.language === 'am' ? 'ዳታ ተጠርጓል' : 'Data Cleared',
            message: settings.language === 'am' ? 'ሁሉም የጥናት ዳታ በተሳካ ሁኔታ ተጠርጓል።' : 'All your focus, task, and study records have been wiped.',
            confirmLabel: settings.language === 'am' ? 'እሺ' : 'OK',
            onConfirm: () => {},
            alertMode: true,
            icon: 'trash-outline',
            iconColor: colors.error,
          });
        }, 350);
      },
    });
  };

  return (
    <SafeAreaWrapper>
      {/* ── Header ──────────────────────── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
          <AppText variant="headline" color={colors.textPrimary}>
            {t.settings}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
          {settings.language === 'am' ? 'አፕሊኬሽኑን እንደ ምርጫዎ ያብጁ' : 'Personalize your offline focus experience'}
        </AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {/* ── Appearance ──────────────────── */}
        <AppSectionHeader title={t.appearance} />
        <AppCard style={styles.settingsSection}>
          <AppText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
            {t.themeMode}
          </AppText>
          <View style={styles.chipRow}>
            {(['light', 'dark', 'amoled'] as const).map((mode) => {
              const isSelected = settings.themeMode === mode;
              const labels = {
                light: t.lightMode,
                dark: t.darkMode,
                amoled: t.amoledMode,
              };
              return (
                <AppChip
                  key={mode}
                  label={labels[mode]}
                  selected={isSelected}
                  color={colors.primary}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
                    setThemeMode(mode);
                    setTheme(mode);
                  }}
                />
              );
            })}
          </View>

          <AppDivider style={{ marginVertical: Spacing.md }} />

          <AppText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
            {t.language}
          </AppText>
          <View style={styles.chipRow}>
            {(['en', 'am'] as const).map((langCode) => {
              const isSelected = settings.language === langCode;
              const labels = {
                en: 'English (US)',
                am: 'አማርኛ (Ethiopian)',
              };
              return (
                <AppChip
                  key={langCode}
                  label={labels[langCode]}
                  selected={isSelected}
                  color={colors.primary}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
                    setLanguage(langCode);
                  }}
                />
              );
            })}
          </View>
        </AppCard>

        {/* ── Ethiopian Localization ──────── */}
        <AppSectionHeader title={settings.language === 'am' ? 'የኢትዮጵያ ምርጫዎች' : 'Ethiopian Localization'} style={{ marginTop: Spacing.lg }} />
        <AppCard style={styles.settingsSection}>
          <AppSwitch
            value={settings.useEthiopianTime}
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
              setUseEthiopianTime(val);
            }}
            label={t.ethiopianTime}
            hint={settings.language === 'am' ? 'በቀን 12 ሰዓት አቆጣጠር ተጠቀም' : 'Display clock in local 12-hour format starting at 6 AM'}
          />
          <AppDivider style={{ marginVertical: Spacing.md }} />
          <AppSwitch
            value={settings.useEthiopianCalendar}
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
              setUseEthiopianCalendar(val);
            }}
            label={t.ethiopianCalendar}
            hint={settings.language === 'am' ? 'የኢትዮጵያ ቀን አቆጣጠር ተጠቀም' : 'Show calendar dates in Ethiopic calendar'}
          />
        </AppCard>

        {/* ── Focus defaults ──────────────── */}
        <AppSectionHeader
          title={t.focusDefaults}
          style={{ marginTop: Spacing.lg }}
          action={<Ionicons name="timer-outline" size={18} color={colors.textSecondary} />}
        />
        <AppCard style={styles.settingsSection}>
          <AppText variant="caption" color={colors.textTertiary} style={{ marginBottom: Spacing.md }}>
            {settings.language === 'am'
              ? 'ለጥናት እና እረፍት ክፍለ-ጊዜዎች ነባሪ የሰዓት ቆይታዎችን ያብጁ።'
              : 'Customize default durations used for study sessions, break times, and your daily target.'}
          </AppText>
          
          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <AppInput
                label={settings.language === 'am' ? 'የፖሞዶሮ ጥናት (ደቂቃ)' : 'Pomodoro Focus (min)'}
                keyboardType="number-pad"
                maxLength={3}
                value={pomodoroWork}
                onChangeText={setPomodoroWork}
                error={isWorkInvalid ? (settings.language === 'am' ? 'ከ1 - 180 ደቂቃ' : 'Must be 1 - 180 min') : undefined}
              />
            </View>
            <View style={{ width: Spacing.md }} />
            <View style={{ flex: 1 }}>
              <AppInput
                label={settings.language === 'am' ? 'የፖሞዶሮ ዕረፍት (ደቂቃ)' : 'Pomodoro Break (min)'}
                keyboardType="number-pad"
                maxLength={2}
                value={pomodoroBreak}
                onChangeText={setPomodoroBreak}
                error={isBreakInvalid ? (settings.language === 'am' ? 'ከ1 - 60 ደቂቃ' : 'Must be 1 - 60 min') : undefined}
              />
            </View>
          </View>

          <View style={[styles.formRow, { marginTop: Spacing.md }]}>
            <View style={{ flex: 1 }}>
              <AppInput
                label={settings.language === 'am' ? 'ጥልቅ ትኩረት (ደቂቃ)' : 'Deep Focus (min)'}
                keyboardType="number-pad"
                maxLength={3}
                value={deepFocus}
                onChangeText={setDeepFocus}
                error={isDeepInvalid ? (settings.language === 'am' ? 'ከ1 - 300 ደቂቃ' : 'Must be 1 - 300 min') : undefined}
              />
            </View>
            <View style={{ width: Spacing.md }} />
            <View style={{ flex: 1 }}>
              <AppInput
                label={settings.language === 'am' ? 'የቀን ትኩረት ግብ (ሰዓት)' : 'Daily Focus Goal (hrs)'}
                keyboardType="number-pad"
                maxLength={2}
                value={dailyGoal}
                onChangeText={setDailyGoal}
                error={isGoalInvalid ? (settings.language === 'am' ? 'ከ1 - 24 ሰዓት' : 'Must be 1 - 24 hrs') : undefined}
              />
            </View>
          </View>

          {hasChanges && (
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <AppButton
                label={settings.language === 'am' ? 'ለውጦችን ሰርዝ' : 'Discard'}
                variant="secondary"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
                  setPomodoroWork(String(settings.pomodoroWorkMinutes));
                  setPomodoroBreak(String(settings.pomodoroBreakMinutes));
                  setDeepFocus(String(settings.deepFocusMinutes));
                  setDailyGoal(String(settings.dailyFocusGoalHours));
                }}
                style={{ flex: 1 }}
              />
              <AppButton
                label={settings.language === 'am' ? 'አስቀምጥ' : 'Save'}
                variant="primary"
                disabled={hasValidationError}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(console.warn);
                  handleSaveFocusDefaults();
                }}
                style={{ flex: 2 }}
                leftIcon={<Ionicons name="checkmark-done" size={18} color="#fff" />}
              />
            </View>
          )}
        </AppCard>

        {/* ── Notifications Link ──────────── */}
        <AppSectionHeader title={t.notificationSettings} style={{ marginTop: Spacing.lg }} />
        <AppCard style={{ padding: 0 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuRow}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <AppText variant="bodyMedium" color={colors.textPrimary}>
                {settings.language === 'am' ? 'የማሳወቂያ ቅንጅቶች' : 'Configure Reminders'}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </AppCard>

        {/* ── Data Management ─────────────── */}
        <AppSectionHeader title={t.dataManagement} style={{ marginTop: Spacing.lg }} />
        <AppCard style={[styles.settingsSection, { gap: Spacing.sm }]}>
          <AppText variant="body" color={colors.textSecondary}>
            {settings.language === 'am' ? 'ሁሉም የጥናት መረጃዎች በስልክዎ ላይ በምስጢር ይቀመጣሉ። ማጥፋት ሲፈልጉ ከዚህ በታች ያለውን መጫን ይችላሉ።' : 'Armimo runs completely offline. All tasks, schedules, and analytics are stored locally on your device.'}
          </AppText>
          <AppButton
            label={settings.language === 'am' ? 'የመግቢያ መመሪያን እንደገና ጀምር' : 'Reset Onboarding'}
            variant="secondary"
            style={{ marginTop: Spacing.xs }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.warn);
              setOnboardingCompleted(false);
            }}
          />
          <AppButton
            label={t.clearAllData}
            variant="danger"
            style={{ marginTop: Spacing.xs }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(console.warn);
              handleClearAllData();
            }}
          />
        </AppCard>

        {/* ── App Info ────────────────────── */}
        <View style={styles.footerInfo}>
          <AppText variant="title" color={colors.textTertiary}>
            {settings.language === 'am' ? APP_NAME_AM : APP_NAME}
          </AppText>
          <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
            {t.version}: {APP_VERSION} (Offline Edition)
          </AppText>
          {settings.language === 'am' ? (
            <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 6, fontStyle: 'italic' }}>
              በኢትዮጵያውያን ተማሪዎች የተሰራ
            </AppText>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, justifyContent: 'center' }}>
              <AppText variant="caption" color={colors.textTertiary} style={{ fontStyle: 'italic' }}>
                Made with
              </AppText>
              <Ionicons name="cafe" size={12} color={colors.textTertiary} />
              <AppText variant="caption" color={colors.textTertiary} style={{ fontStyle: 'italic' }}>
                for Ethiopian students
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>

      <AppConfirmDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        cancelLabel={dialogConfig.cancelLabel}
        onConfirm={() => {
          dialogConfig.onConfirm();
          setDialogConfig((prev) => ({ ...prev, visible: false }));
        }}
        onCancel={() => {
          if (dialogConfig.onCancel) {
            dialogConfig.onCancel();
          }
          setDialogConfig((prev) => ({ ...prev, visible: false }));
        }}
        isDestructive={dialogConfig.isDestructive}
        alertMode={dialogConfig.alertMode}
        icon={dialogConfig.icon}
        iconColor={dialogConfig.iconColor}
      />
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
  settingsSection: {
    padding: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  formRow: {
    flexDirection: 'row',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
});
