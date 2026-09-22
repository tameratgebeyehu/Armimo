// ─────────────────────────────────────────────
// Armimo / አርምሞ — Home Screen (Modern Redesign & Animations)
// ─────────────────────────────────────────────

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/Layout';
import { AppText } from '../components/AppText';
import { AppCard } from '../components/AppCard';
import { AppProgressBar, AppSectionHeader, AppEmptyState, AppBadge } from '../components/AppUIKit';
import { useTheme } from '../theme/ThemeProvider';
import { useTaskStore } from '../store/taskStore';
import { useFocusStore } from '../store/focusStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTimetableStore } from '../store/timetableStore';
import { Spacing, Radius, FontFamily } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import {
  formatHours,
  formatRelativeDate,
  formatEthiopianDate,
  formatEthiopianTime,
  getDayName,
} from '../utils/dateUtils';
import { getStrings } from '../localization/strings';
import { MOTIVATIONAL_MESSAGES_EN, MOTIVATIONAL_MESSAGES_AM, getSubject } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function getGreeting(lang: 'en' | 'am'): string {
  const h = new Date().getHours();
  if (lang === 'am') {
    if (h < 12) return 'እንደምን አደሩ';
    if (h < 17) return 'እንደምን ዋሉ';
    return 'እንደምን አመሹ';
  }
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingIcon(h: number): keyof typeof Ionicons.glyphMap {
  if (h >= 6 && h < 18) {
    return 'sunny';
  }
  return 'moon';
}

function activityLevel(secs: number): 0 | 1 | 2 | 3 {
  if (secs <= 0) return 0;
  if (secs < 1800) return 1;   // < 30 min
  if (secs < 3600) return 2;   // < 1 h
  return 3;                     // ≥ 1 h
}

const BAR_MAX_H = 56;

// ── Tactile Interactive scale-on-press Touchable ──
interface BouncingTouchableProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: any;
  activeOpacity?: number;
}
function BouncingTouchable({ onPress, children, style, activeOpacity = 0.9 }: BouncingTouchableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 180,
      friction: 9,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 9,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const lang = settings.language;
  const t = getStrings(lang);

  const checkStreak = useFocusStore((s) => s.checkStreak);
  const [currentDate, setCurrentDate] = useState(new Date());

  // ── Animation References ──────────────────────
  const entranceAnim1 = useRef(new Animated.Value(0)).current; // Header & Quote
  const entranceAnim2 = useRef(new Animated.Value(0)).current; // Stats Grid
  const entranceAnim3 = useRef(new Animated.Value(0)).current; // Daily Goal
  const entranceAnim4 = useRef(new Animated.Value(0)).current; // Weekly Activity & Tasks/Schedule

  const progressAnim = useRef(new Animated.Value(0)).current; // Goal bar completion
  const weekChartAnim = useRef(new Animated.Value(0)).current; // Bar heights grow

  // ── Floating Background Blobs Animation Values ─
  const blob1Pos = useRef(new Animated.ValueXY({ x: -100, y: -50 })).current;
  const blob2Pos = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH, y: 150 })).current;
  const blob3Pos = useRef(new Animated.ValueXY({ x: 50, y: SCREEN_HEIGHT - 200 })).current;

  // ── Interactive Tooltip & Quote Shuffle States ─
  const [activeTooltip, setActiveTooltip] = useState<number | null>(6); // Default to today (index 6)
  const tooltipFade = useRef(new Animated.Value(1)).current;
  
  const [quoteIndex, setQuoteIndex] = useState(currentDate.getDate());
  const quoteOpacity = useRef(new Animated.Value(1)).current;
  const quoteTranslateY = useRef(new Animated.Value(0)).current;
  const quoteIconRotation = useRef(new Animated.Value(0)).current;

  // ── Store selectors ──────────────────────────
  const tasks = useTaskStore((s) => s.tasks);
  const getCompletedCount  = useTaskStore((s) => s.getCompletedCount);
  const getTotalCount      = useTaskStore((s) => s.getTotalCount);
  const getDailyProgress   = useTaskStore((s) => s.getDailyProgress);
  const getTodaySessions   = useFocusStore((s) => s.getTodaySessions);
  const getTodayFocusSeconds = useFocusStore((s) => s.getTodayFocusSeconds);
  const streak             = useFocusStore((s) => s.streak);
  const timetableStore     = useTimetableStore();
  const dailyGoalHours     = settings.dailyFocusGoalHours;

  const todayFocusSecs   = getTodayFocusSeconds();
  const todaySessionCount = getTodaySessions().length;
  const completedTasks   = getCompletedCount();
  const totalTasks       = getTotalCount();
  const dailyProgress    = getDailyProgress();
  
  // Calculate raw progress (0 to 1)
  const focusProgress = useMemo(() => {
    const targetSecs = dailyGoalHours * 3600;
    return targetSecs > 0 ? Math.min(1, todayFocusSecs / targetSecs) : 0;
  }, [todayFocusSecs, dailyGoalHours]);

  // ── Setup background drifting blobs ──────────
  useEffect(() => {
    const animateBlob = (anim: Animated.ValueXY, targetX: number, targetY: number, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: { x: targetX, y: targetY },
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: { x: -targetX / 2, y: -targetY / 2 },
            duration: duration * 1.2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: { x: 0, y: 0 },
            duration: duration * 0.8,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateBlob(blob1Pos, 120, 80, 16000);
    animateBlob(blob2Pos, -150, 120, 20000);
    animateBlob(blob3Pos, 110, -130, 24000);
  }, []);

  // ── Staggered Entrance & Growth Trigger ───────
  useEffect(() => {
    checkStreak();

    // Trigger staggered entrance
    Animated.stagger(100, [
      Animated.timing(entranceAnim1, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(entranceAnim2, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(entranceAnim3, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(entranceAnim4, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Grow Weekly Bar Chart heights
      Animated.timing(weekChartAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    const timer = setInterval(() => setCurrentDate(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // ── Animate Daily Goal loader bar on progress change ──
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: focusProgress,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focusProgress]);

  // Interpolate slide translateY translation
  const slideY = (anim: Animated.Value) => {
    return anim.interpolate({
      inputRange: [0, 1],
      outputRange: [24, 0],
    });
  };

  // Interpolate Daily Goal width percentage
  const goalWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ── Motivational Quote Shuffling Animation ───
  const quoteList = useMemo(() => {
    return lang === 'am' ? MOTIVATIONAL_MESSAGES_AM : MOTIVATIONAL_MESSAGES_EN;
  }, [lang]);

  const motivationalMsg = useMemo(() => {
    const idx = quoteIndex % quoteList.length;
    return quoteList[idx] ?? quoteList[0]!;
  }, [quoteList, quoteIndex]);

  const handleShuffleQuote = () => {
    // 1. Rotate the bulb icon 360deg
    quoteIconRotation.setValue(0);
    Animated.timing(quoteIconRotation, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // 2. Fade out text, shift down, change index, fade back in
    Animated.parallel([
      Animated.timing(quoteOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(quoteTranslateY, {
        toValue: 8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setQuoteIndex((prev) => prev + 1);
      quoteTranslateY.setValue(-8);
      Animated.parallel([
        Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(quoteTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(1.0)),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Icon rotate interpolation
  const iconSpin = quoteIconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Date / time strings ──────────────────────
  const greeting = getGreeting(lang);
  const dateStr = (settings.useEthiopianCalendar || lang === 'am')
    ? formatEthiopianDate(currentDate, lang)
    : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = settings.useEthiopianTime
    ? formatEthiopianTime(currentDate.getHours(), currentDate.getMinutes())
    : currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // ── Weekly activity bars ─────────────────────
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const secs = streak.weeklyData[6 - i] ?? 0;
      const level = activityLevel(secs);
      const isToday = i === 6;
      return { d, secs, level, isToday, dayName: getDayName(d.getDay(), lang) };
    });
  }, [streak.weeklyData, lang]);

  const maxWeekSecs = Math.max(...weekDays.map((w) => w.secs), 1800); // min 30m for scale

  // ── Active Tooltip Selector Helper ───────────
  const selectBarTooltip = (index: number) => {
    if (activeTooltip === index) {
      Animated.timing(tooltipFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setActiveTooltip(null));
    } else {
      Animated.timing(tooltipFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setActiveTooltip(index);
        Animated.timing(tooltipFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // ── Today's upcoming timetable sessions ──────
  const todayDow = currentDate.getDay(); // 0=Sun…6=Sat
  const todaySessions = useMemo(() => {
    return timetableStore.getSessionsForDay(todayDow)
      .filter((s) => !s.completed)
      .slice(0, 3);
  }, [todayDow, timetableStore.sessions]);

  // ── Priority colors ──────────────────────────
  const priorityColor = (p?: string) => {
    if (p === 'high')   return colors.error;
    if (p === 'medium') return colors.warning;
    return colors.textTertiary;
  };

  // ── Activity bar colour ──────────────────────
  const barColors = (level: number, isToday: boolean): [string, string] => {
    if (isToday) {
      return [colors.primary, colors.primary + 'D0'];
    }
    if (level === 0) return [colors.surface3, colors.surface3];
    if (level === 1) return [colors.primary + '30', colors.primary + '50'];
    if (level === 2) return [colors.primary + '70', colors.primary + '9A'];
    return [colors.primary, colors.primary + 'D0'];
  };

  // Time-of-day contextual theme color gradients for header
  const headerGradients = useMemo<[string, string]>(() => {
    const h = currentDate.getHours();
    if (isDark) {
      if (h >= 6 && h < 12) {
        return ['rgba(30, 41, 59, 0.95)', 'rgba(30, 27, 75, 0.95)']; // Warm morning dark
      } else if (h >= 12 && h < 17) {
        return ['rgba(15, 23, 42, 0.95)', 'rgba(30, 58, 138, 0.95)']; // Bright afternoon dark
      } else {
        return ['rgba(10, 10, 20, 0.95)', 'rgba(15, 23, 42, 0.95)']; // Cosmic night dark
      }
    } else {
      if (h >= 6 && h < 12) {
        return ['#EFF6FF', '#DBEAFE']; // Bright morning light
      } else if (h >= 12 && h < 17) {
        return ['#EFF6FF', '#DBEAFE']; // Bright afternoon light
      } else {
        return ['#EFF6FF', '#DBEAFE']; // Soft night light
      }
    }
  }, [currentDate, isDark]);

  return (
    <SafeAreaWrapper>
      {/* ── Background Ambient Floating Blobs ── */}
      <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]} pointerEvents="none">
        <Animated.View
          style={[
            styles.floatingBlob,
            {
              backgroundColor: colors.primary,
              opacity: isDark ? 0.05 : 0.03,
              transform: blob1Pos.getTranslateTransform(),
              width: 260,
              height: 260,
              borderRadius: 130,
              top: 50,
              left: -70,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingBlob,
            {
              backgroundColor: colors.accentGreen,
              opacity: isDark ? 0.04 : 0.02,
              transform: blob2Pos.getTranslateTransform(),
              width: 300,
              height: 300,
              borderRadius: 150,
              top: 220,
              right: -90,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingBlob,
            {
              backgroundColor: colors.accentOrange,
              opacity: isDark ? 0.04 : 0.02,
              transform: blob3Pos.getTranslateTransform(),
              width: 240,
              height: 240,
              borderRadius: 120,
              bottom: 120,
              left: 40,
            },
          ]}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Segment 1: Header & Quote ────────────────── */}
        <Animated.View style={{ opacity: entranceAnim1, transform: [{ translateY: slideY(entranceAnim1) }] }}>
          
          {/* Linear Gradient Header Card */}
          <LinearGradient
            colors={headerGradients}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.headerGradientCard,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
              }
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={[styles.avatarCircle, { backgroundColor: '#FFFFFF', borderColor: colors.primary + '30' }]}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="headline" color={colors.textPrimary} style={styles.greetingText}>
                    {greeting} 👋
                  </AppText>
                  <AppText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 2 }}>
                    {dateStr}
                  </AppText>
                </View>
              </View>
              
              {/* Glowing live time pill */}
              <View style={[styles.timePill, { backgroundColor: colors.surface + 'F0', borderColor: colors.primary + '30' }]}>
                <Ionicons name="time-outline" size={13} color={colors.primary} />
                <AppText variant="labelSm" color={colors.primary} style={{ marginLeft: 4 }}>
                  {timeStr}
                </AppText>
              </View>
            </View>
          </LinearGradient>

          {/* Premium Animated Motivational Quote Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleShuffleQuote}
            style={[
              styles.quoteCard,
              {
                backgroundColor: isDark ? colors.surface + '60' : colors.primaryLight,
                borderColor: colors.primary + '18',
                borderLeftColor: colors.primary,
              }
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: iconSpin }] }}>
              <Ionicons name="bulb-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
            </Animated.View>
            <Animated.View style={{ flex: 1, opacity: quoteOpacity, transform: [{ translateY: quoteTranslateY }] }}>
              <AppText variant="bodySm" color={isDark ? colors.textPrimary : colors.primary} style={styles.quoteText}>
                {motivationalMsg}
              </AppText>
            </Animated.View>
            <View style={styles.quoteShuffleBtn}>
              <Ionicons name="shuffle" size={14} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Segment 2: Stats Grid ────────────────────── */}
        <Animated.View style={{ opacity: entranceAnim2, transform: [{ translateY: slideY(entranceAnim2) }] }}>
          <View style={styles.statGrid}>
            {/* Focus Time */}
            <BouncingTouchable
              style={{ flex: 1 }}
              onPress={() => {}}
            >
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.primary + '20' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="timer-outline" size={20} color={colors.primary} />
                </View>
                <AppText variant="title" color={colors.primary} style={{ marginTop: Spacing.sm }}>
                  {formatHours(todayFocusSecs)}
                </AppText>
                <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2, textAlign: 'center' }}>
                  {t.totalFocusHours}
                </AppText>
              </View>
            </BouncingTouchable>

            {/* Sessions */}
            <BouncingTouchable
              style={{ flex: 1 }}
              onPress={() => {}}
            >
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.accentGreen + '20' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: colors.accentGreen + '14' }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.accentGreen} />
                </View>
                <AppText variant="title" color={colors.accentGreen} style={{ marginTop: Spacing.sm }}>
                  {todaySessionCount}
                </AppText>
                <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2, textAlign: 'center' }}>
                  {t.sessionsCompleted}
                </AppText>
              </View>
            </BouncingTouchable>

            {/* Streak */}
            <BouncingTouchable
              style={{ flex: 1 }}
              onPress={() => {}}
            >
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.accentOrange + '20' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: colors.accentOrange + '14' }]}>
                  <Ionicons name="flame-outline" size={20} color={colors.accentOrange} />
                </View>
                <AppText variant="title" color={colors.accentOrange} style={{ marginTop: Spacing.sm }}>
                  {streak.currentStreak}
                </AppText>
                <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2, textAlign: 'center' }}>
                  {t.currentStreak}
                </AppText>
              </View>
            </BouncingTouchable>
          </View>
        </Animated.View>

        {/* ── Segment 3: Daily Focus Goal ──────────────── */}
        <Animated.View style={{ opacity: entranceAnim3, transform: [{ translateY: slideY(entranceAnim3) }] }}>
          <AppSectionHeader title={t.dailyGoal} style={{ marginTop: Spacing.xs }} />
          
          <BouncingTouchable onPress={() => {}}>
            <AppCard style={styles.goalCard}>
              <View style={styles.goalRow}>
                <View>
                  <AppText variant="bodyMedium" color={colors.textPrimary} weight="semiBold">
                    {formatHours(todayFocusSecs)}
                    <AppText variant="bodySm" color={colors.textTertiary}> / {dailyGoalHours}h</AppText>
                  </AppText>
                  <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
                    {lang === 'am' ? 'ዛሬ ያጠናሁት' : 'studied today'}
                  </AppText>
                </View>
                <View style={[styles.percentBadge, { backgroundColor: colors.primary + '14' }]}>
                  <AppText variant="label" color={colors.primary}>
                    {Math.round(focusProgress * 100)}%
                  </AppText>
                </View>
              </View>
              
              {/* Premium Progress Bar Track */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: goalWidth,
                        backgroundColor: colors.primary,
                        borderRadius: Radius.full,
                        overflow: 'hidden',
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.accentGreen]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </Animated.View>
                </View>
              </View>
            </AppCard>
          </BouncingTouchable>
        </Animated.View>

        {/* ── Segment 4: Weekly Activity, Tasks & Schedule ── */}
        <Animated.View style={{ opacity: entranceAnim4, transform: [{ translateY: slideY(entranceAnim4) }] }}>
          <AppSectionHeader
            title={lang === 'am' ? 'ሳምንታዊ እንቅስቃሴ' : 'Weekly Activity'}
            action={
              <AppBadge
                label={`${weekDays.filter((w) => w.level > 0).length}/7 ${lang === 'am' ? 'ቀናት' : 'days'}`}
                variant="neutral"
              />
            }
            style={{ marginTop: Spacing.sm }}
          />

          <AppCard style={styles.weeklyChartCard}>
            {/* Week total summary */}
            <View style={styles.weekSummaryRow}>
              <Ionicons name="analytics" size={14} color={colors.primary} />
              <AppText variant="caption" color={colors.textTertiary} style={{ marginLeft: 5 }}>
                {lang === 'am' ? 'ይህ ሳምንት ጠቅላላ:' : 'This week total:'}
              </AppText>
              <AppText variant="label" color={colors.primary} style={{ marginLeft: 5 }}>
                {formatHours(weekDays.reduce((a, w) => a + w.secs, 0))}
              </AppText>
            </View>

            {/* Interactive Tooltip Space */}
            <View style={styles.tooltipHeightWrapper}>
              {activeTooltip !== null && (
                <Animated.View
                  style={[
                    styles.tooltipContainer,
                    {
                      opacity: tooltipFade,
                      left: `${(activeTooltip * 14.28) + 7.14}%`,
                    }
                  ]}
                >
                  <View style={[styles.tooltipBubble, { backgroundColor: colors.surface3, borderColor: colors.primary + '30' }]}>
                    <AppText variant="labelSm" color={colors.textPrimary} style={{ fontSize: 10, textAlign: 'center' }}>
                      {weekDays[activeTooltip] ? getDayName(weekDays[activeTooltip]!.d.getDay(), lang) : ''}
                    </AppText>
                    <AppText variant="bodySm" color={colors.primary} weight="bold" style={{ fontSize: 11, marginTop: 1, textAlign: 'center' }}>
                      {weekDays[activeTooltip] ? formatHours(weekDays[activeTooltip]!.secs) : '0h'}
                    </AppText>
                  </View>
                  <View style={[styles.tooltipArrow, { borderTopColor: colors.surface3 }]} />
                </Animated.View>
              )}
            </View>

            {/* Bar chart with grow animation */}
            <View style={styles.barsRow}>
              {weekDays.map(({ secs, level, isToday, dayName }, i) => {
                const targetBarH = secs > 0 ? Math.max(10, Math.round((secs / maxWeekSecs) * BAR_MAX_H)) : 6;
                
                // Interpolate height growth per day bar
                const barH = weekChartAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, targetBarH],
                });

                const isCurrentlyActiveTooltip = activeTooltip === i;

                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.8}
                    onPress={() => selectBarTooltip(i)}
                    style={styles.barCol}
                  >
                    {/* Bar track container */}
                    <View style={[
                      styles.barTrack,
                      {
                        backgroundColor: colors.surface2,
                        borderColor: isCurrentlyActiveTooltip ? colors.primary + '40' : 'transparent',
                        borderWidth: 1,
                      }
                    ]}>
                      <Animated.View
                        style={[
                          styles.bar,
                          {
                            height: barH,
                            borderRadius: Radius.xs,
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={barColors(level, isToday)}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={StyleSheet.absoluteFillObject}
                        />
                      </Animated.View>
                    </View>

                    {/* Today indicator dot */}
                    <View style={styles.todayDotWrap}>
                      {isToday && (
                        <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>

                    {/* Day label */}
                    <AppText
                      variant="labelSm"
                      color={isToday || isCurrentlyActiveTooltip ? colors.primary : colors.textTertiary}
                      style={{ fontSize: 10, fontFamily: isCurrentlyActiveTooltip ? FontFamily.bold : FontFamily.regular }}
                    >
                      {dayName}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Chart Legend */}
            <View style={styles.legendRow}>
              {[
                { label: lang === 'am' ? 'ምንም' : 'None',   color: colors.surface3 },
                { label: lang === 'am' ? 'ዝቅተኛ' : 'Low',  color: colors.primary + '40' },
                { label: lang === 'am' ? 'መካከለኛ' : 'Mid', color: colors.primary + '80' },
                { label: lang === 'am' ? 'ከፍተኛ' : 'High',  color: colors.primary },
              ].map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <AppText variant="labelSm" color={colors.textTertiary} style={{ fontSize: 9 }}>
                    {item.label}
                  </AppText>
                </View>
              ))}
            </View>
          </AppCard>

          {/* ── Today's Tasks Checklist Preview ────────── */}
          <AppSectionHeader
            title={`${t.filterToday} ${t.tasks}`}
            action={
              totalTasks > 0 ? (
                <AppBadge
                  label={`${completedTasks}/${totalTasks}`}
                  variant={completedTasks === totalTasks && totalTasks > 0 ? 'success' : 'neutral'}
                />
              ) : undefined
            }
          />

          {totalTasks === 0 ? (
            <AppEmptyState
              icon="checkmark-done-outline"
              title={t.noTasksToday}
              subtitle={t.createFirstTask}
              style={{ paddingVertical: Spacing.lg }}
            />
          ) : (
            <AppCard style={{ marginBottom: Spacing.md }}>
              <AppProgressBar
                progress={dailyProgress}
                color={colors.accentGreen}
                height={8}
                label={
                  lang === 'am'
                    ? `ከ ${totalTasks} ውስጥ ${completedTasks} ተጠናቀዋል`
                    : `${completedTasks} of ${totalTasks} completed`
                }
              />
              <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                {tasks
                  .filter((tk) => !tk.completed)
                  .slice(0, 3)
                  .map((task) => {
                    const subj = getSubject(task.subject);
                    return (
                      <BouncingTouchable
                        key={task.id}
                        onPress={() => {}}
                        style={styles.taskCardTouchable}
                      >
                        <View style={styles.taskRow}>
                          {/* Subject icon badge */}
                          <View style={[styles.subjectIconBadge, { backgroundColor: subj.color + '15', borderColor: subj.color + '30' }]}>
                            <View style={[styles.taskDot, { backgroundColor: priorityColor(task.priority) }]} />
                          </View>
                          
                          <View style={{ flex: 1 }}>
                            <AppText variant="bodyMedium" color={colors.textPrimary} numberOfLines={1}>
                              {task.title}
                            </AppText>
                            <AppText variant="caption" color={colors.textTertiary}>
                              {lang === 'am' ? subj.labelAm : subj.label}
                              {' · '}{task.estimatedDuration}m
                              {task.deadline ? ` · ${formatRelativeDate(task.deadline, lang)}` : ''}
                            </AppText>
                          </View>
                          {task.priority === 'high' && (
                            <View style={[styles.priorityFlagBadge, { backgroundColor: colors.error + '10' }]}>
                              <Ionicons name="alert-circle" size={13} color={colors.error} />
                            </View>
                          )}
                        </View>
                      </BouncingTouchable>
                    );
                  })}
                {tasks.filter((tk) => !tk.completed).length > 3 && (
                  <AppText variant="caption" color={colors.textTertiary} align="center" style={{ marginTop: Spacing.xs }}>
                    +{tasks.filter((tk) => !tk.completed).length - 3}{' '}
                    {lang === 'am' ? 'ተጨማሪ ተግባራት' : 'more tasks'}
                  </AppText>
                )}
              </View>
            </AppCard>
          )}

          {/* ── Today's Upcoming Timetable Schedule ──────── */}
          {todaySessions.length > 0 && (
            <>
              <AppSectionHeader
                title={lang === 'am' ? 'ዛሬ የሚቀጥሉ ክፍለ ጊዜዎች' : "Today's Schedule"}
                action={
                  <AppBadge label={`${todaySessions.length}`} variant="neutral" />
                }
              />
              <AppCard style={{ marginBottom: Spacing.xl }}>
                <View style={{ gap: Spacing.sm }}>
                  {todaySessions.map((session, idx) => {
                    const subj = getSubject(session.subject as any);
                    return (
                      <View key={session.id ?? idx} style={styles.sessionRow}>
                        <View style={[styles.sessionColorBar, { backgroundColor: subj.color }]} />
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMedium" color={colors.textPrimary} numberOfLines={1}>
                            {session.title || (lang === 'am' ? subj.labelAm : subj.label)}
                          </AppText>
                          <AppText variant="caption" color={colors.textTertiary}>
                            {session.startTime} – {session.endTime}
                            {' · '}
                            {lang === 'am' ? subj.labelAm : subj.label}
                          </AppText>
                        </View>
                        <View style={[styles.sessionBadge, { backgroundColor: colors.surface2 }]}>
                          <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </AppCard>
            </>
          )}

          {/* Bottom padding spacing */}
          {todaySessions.length === 0 && <View style={{ height: Spacing.xl }} />}
        </Animated.View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // ── Floating Ambient Background Blobs ──
  floatingBlob: {
    position: 'absolute',
    borderRadius: Radius.full,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 50,
      },
    }),
  },

  // ── Header Card ──
  headerGradientCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  greetingText: {
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },

  // ── Interactive Quote Card ──
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  quoteText: {
    marginLeft: 2,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quoteShuffleBtn: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Stat Grid ──
  statGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Goal Card ──
  goalCard: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressTrack: {
    height: 10,
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: 10,
  },

  // ── Weekly Activity Chart ──
  weeklyChartCard: {
    marginBottom: Spacing.md,
    position: 'relative',
    overflow: 'visible', // Ensure tooltip renders outside card boundaries cleanly
  },
  weekSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  
  // Tooltip
  tooltipHeightWrapper: {
    height: 48,
    position: 'relative',
    width: '100%',
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 2,
    width: 64,
    marginLeft: -32, // Offset to center on active day bar
    alignItems: 'center',
    zIndex: 999,
  },
  tooltipBubble: {
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    paddingTop: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    height: BAR_MAX_H,
    borderRadius: Radius.xs,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
  },
  todayDotWrap: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },

  // ── Tasks ──
  taskCardTouchable: {
    width: '100%',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  subjectIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityFlagBadge: {
    padding: 4,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Sessions ──
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sessionColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  sessionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
