// ─────────────────────────────────────────────
// Armimo / አርምሞ — Notification Settings Screen
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaWrapper } from '../../components/Layout';
import { AppText } from '../../components/AppText';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AppDivider, AppSwitch } from '../../components/AppUIKit';
import { useTheme } from '../../theme/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { Spacing, Radius } from '../../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { getStrings } from '../../localization/strings';
import { useNavigation } from '@react-navigation/native';
import { NotificationService } from '../../notifications/NotificationService';

export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // Settings store
  const { settings, updateNotificationSettings } = useSettingsStore();
  const t = getStrings(settings.language);
  const ns = settings.notifications;

  // Local values for numeric time textboxes
  const [remindBefore, setRemindBefore] = useState(String(ns.reminderMinutesBefore));
  const [dailyTime, setDailyTime] = useState(ns.dailyReminderTime);
  const [streakTime, setStreakTime] = useState(ns.streakReminderTime);

  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});

  const handleToggleEnabled = async (val: boolean) => {
    if (val) {
      const granted = await NotificationService.configure();
      if (!granted) {
        const title = settings.language === 'am' ? 'ማሳወቂያ አልተፈቀደም' : 'Permissions Required';
        const msg = settings.language === 'am'
          ? 'እባክዎ በመሳሪያዎ ቅንብር ውስጥ ለማሳወቂያዎች ፈቃድ ይስጡ።'
          : 'Please enable notification permissions in your device settings to receive reminders.';

        Alert.alert(
          title,
          msg,
          [
            { text: settings.language === 'am' ? 'እሺ' : 'Cancel', style: 'cancel' },
            {
              text: settings.language === 'am' ? 'ቅንብሮች ክፈት' : 'Open Settings',
              onPress: () => {
                Linking.openSettings().catch(() => {});
              }
            }
          ]
        );
        return;
      }
    }
    updateNotificationSettings({ enabled: val });
  };

  const handleUpdateBeforeMinutes = (val: string) => {
    setRemindBefore(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 120) {
      updateNotificationSettings({ reminderMinutesBefore: num });
    }
  };

  const handleSaveTimeConfigs = () => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const errors: Record<string, string> = {};

    if (!timeRegex.test(dailyTime)) {
      errors.daily = settings.language === 'am' ? 'ትክክለኛ ሰዓት ያስገቡ (HH:MM)' : 'Invalid time (HH:MM)';
    }
    if (!timeRegex.test(streakTime)) {
      errors.streak = settings.language === 'am' ? 'ትክክለኛ ሰዓት ያስገቡ (HH:MM)' : 'Invalid time (HH:MM)';
    }

    setTimeErrors(errors);

    if (Object.keys(errors).length === 0) {
      updateNotificationSettings({
        dailyReminderTime: dailyTime,
        streakReminderTime: streakTime,
      });
      // Go back
      navigation.goBack();
    }
  };

  return (
    <SafeAreaWrapper>
      {/* ── Top Bar / Back button ───────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="title" color={colors.textPrimary}>
          {settings.language === 'am' ? 'የማሳወቂያ ምርጫዎች' : 'Reminders & Notifications'}
        </AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {/* ── Master Switch ───────────────── */}
        <AppCard style={styles.masterCard}>
          <AppSwitch
            value={ns.enabled}
            onValueChange={handleToggleEnabled}
            label={settings.language === 'am' ? 'ማሳወቂያዎችን ፍቀድ' : 'Allow Reminders'}
            hint={settings.language === 'am' ? 'ሁሉንም አካባቢያዊ ማሳወቂያዎች አንቃ/አጥፋ' : 'Enable or disable all local offline reminders'}
          />
        </AppCard>

        {ns.enabled && (
          <View style={{ gap: Spacing.lg, marginTop: Spacing.md }}>
            {/* ── Categories ─────────────────── */}
            <View>
              <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
                {settings.language === 'am' ? 'የማሳወቂያ ዓይነቶች' : 'Reminder Types'}
              </AppText>
              <AppCard style={styles.categoriesCard}>
                <AppSwitch
                  value={ns.studySessionReminders}
                  onValueChange={(val) => updateNotificationSettings({ studySessionReminders: val })}
                  label={settings.language === 'am' ? 'የሰዓት ሰሌዳ ጥናት' : 'Study Sessions'}
                  hint={settings.language === 'am' ? 'የጥናት ሰዓት ሰሌዳ ሲቃረብ አስታውስ' : 'Notify when a scheduled study session is near'}
                />
                <AppDivider style={styles.divider} />
                <AppSwitch
                  value={ns.focusReminders}
                  onValueChange={(val) => updateNotificationSettings({ focusReminders: val })}
                  label={settings.language === 'am' ? 'የትኩረት ክፍለ ጊዜዎች' : 'Focus Timers'}
                  hint={settings.language === 'am' ? 'ከትምህርት ሰዓት በኋላ ለዕረፍት አስታውስ' : 'Break reminders and session end notifications'}
                />
                <AppDivider style={styles.divider} />
                <AppSwitch
                  value={ns.deadlineReminders}
                  onValueChange={(val) => updateNotificationSettings({ deadlineReminders: val })}
                  label={settings.language === 'am' ? 'የተግባር ማጠናቀቂያ' : 'Task Deadlines'}
                  hint={settings.language === 'am' ? 'የቤት ሥራ ወይም ንባብ ማጠናቀቂያ ሲቃረብ አስታውስ' : 'Notify for upcoming task deadlines'}
                />
                <AppDivider style={styles.divider} />
                <AppSwitch
                  value={ns.streakReminders}
                  onValueChange={(val) => updateNotificationSettings({ streakReminders: val })}
                  label={settings.language === 'am' ? 'ቀጣይነት (ስትሪክ)' : 'Streaks Consistency'}
                  hint={settings.language === 'am' ? 'የእለት የትኩረት ስራዎ እንዳይቋረጥ አስታውስ' : 'Daily nudge to keep your study streak alive'}
                />
                <AppDivider style={styles.divider} />
                <AppSwitch
                  value={ns.dailyGoalReminders}
                  onValueChange={(val) => updateNotificationSettings({ dailyGoalReminders: val })}
                  label={settings.language === 'am' ? 'የእለት ትኩረት ግብ' : 'Daily Goals'}
                  hint={settings.language === 'am' ? 'የእለት የትኩረት ግብዎን ሲያጠናቅቁ አሳውቅ' : 'Nudge if you haven\'t reached your daily focus goal'}
                />
              </AppCard>
            </View>

            {/* ── Time Configuration ─────────── */}
            <View>
              <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
                {settings.language === 'am' ? 'የሰዓት ቅንጅቶች' : 'Time Configurations'}
              </AppText>
              <AppCard style={styles.configsCard}>
                {ns.studySessionReminders && (
                  <View style={{ marginBottom: Spacing.md }}>
                    <AppInput
                      label={settings.language === 'am' ? 'ከስንት ደቂቃ በፊት አስታውስ' : 'Remind Before (minutes)'}
                      keyboardType="number-pad"
                      maxLength={3}
                      value={remindBefore}
                      onChangeText={handleUpdateBeforeMinutes}
                      hint={settings.language === 'am' ? 'ጥናቱ ከመጀመሩ በፊት ማሳወቂያ የሚላክበት ደቂቃ' : 'Minutes before study session start to notify'}
                    />
                  </View>
                )}

                <View style={styles.inputsRow}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label={settings.language === 'am' ? 'የእለት ግብ አስታዋሽ ሰዓት' : 'Daily Reminder Time'}
                      placeholder="20:00"
                      value={dailyTime}
                      onChangeText={(txt) => {
                        setDailyTime(txt);
                        if (timeErrors.daily) setTimeErrors(prev => ({ ...prev, daily: '' }));
                      }}
                      error={timeErrors.daily}
                      hint="24h e.g. 20:00"
                    />
                  </View>
                  <View style={{ width: Spacing.md }} />
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label={settings.language === 'am' ? 'የስትሪክ አስታዋሽ ሰዓት' : 'Streak Reminder Time'}
                      placeholder="21:00"
                      value={streakTime}
                      onChangeText={(txt) => {
                        setStreakTime(txt);
                        if (timeErrors.streak) setTimeErrors(prev => ({ ...prev, streak: '' }));
                      }}
                      error={timeErrors.streak}
                      hint="24h e.g. 21:00"
                    />
                  </View>
                </View>
              </AppCard>
            </View>

            {/* Save Button */}
            <AppButton
              label={t.save}
              variant="primary"
              style={styles.saveBtn}
              onPress={handleSaveTimeConfigs}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  masterCard: {
    padding: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
    paddingLeft: 4,
  },
  categoriesCard: {
    padding: Spacing.md,
  },
  divider: {
    marginVertical: Spacing.xs,
  },
  configsCard: {
    padding: Spacing.md,
  },
  inputsRow: {
    flexDirection: 'row',
  },
  saveBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
