// ─────────────────────────────────────────────
// Armimo / አርምሞ — Focus Screen (Pomodoro Loop)
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { SafeAreaWrapper } from '../../components/Layout';
import { AppText } from '../../components/AppText';
import { AppCard } from '../../components/AppCard';
import { AppModal } from '../../components/AppModal';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AppSectionHeader, AppProgressBar } from '../../components/AppUIKit';
import { useTheme } from '../../theme/ThemeProvider';
import { useFocusStore } from '../../store/focusStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Spacing, Radius, FontFamily, FontSize } from '../../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { FOCUS_MODES, SUBJECTS, AMBIENT_SOUNDS } from '../../constants';
import { FocusMode, SubjectKey } from '../../types';
import { formatSeconds, formatHours } from '../../utils/dateUtils';
import { getStrings } from '../../localization/strings';

// ── AnimatedCircle ─────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Rising Sparkles ────────────────────────────
interface SparkleParticle {
  id: number;
  leftPct: number;
  size: number;
  color: string;
  anim: Animated.Value;
  duration: number;
  delay: number;
}

function RisingSparkles({ active, palette }: { active: boolean; palette?: string[] }) {
  const animsRef = useRef<Animated.CompositeAnimation[]>([]);
  const [particles, setParticles] = useState<SparkleParticle[]>([]);

  useEffect(() => {
    if (!active) {
      animsRef.current.forEach(a => a.stop());
      animsRef.current = [];
      setParticles([]);
      return;
    }

    const PALETTE = palette ?? ['#FFD700', '#FFC107', '#FF9800', '#FFEB3B', '#FFFFFF', '#E8F5E9', '#B2EBF2'];

    const list: SparkleParticle[] = Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      leftPct: 5 + Math.random() * 90,
      size: 4 + Math.random() * 7,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)]!,
      anim: new Animated.Value(0),
      duration: 2200 + Math.random() * 2200,
      delay: Math.random() * 2000,
    }));

    setParticles(list);

    const animations = list.map(p => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.anim, {
            toValue: 1,
            duration: p.duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    });

    animsRef.current = animations;
    return () => { animations.forEach(a => a.stop()); };
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map(p => {
        const translateY = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -340] });
        const opacity    = p.anim.interpolate({ inputRange: [0, 0.12, 0.78, 1], outputRange: [0, 0.9, 0.8, 0] });
        const scale      = p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.6] });
        return (
          <Animated.View
            key={p.id}
            style={{
              position: 'absolute',
              bottom: 20,
              left: `${p.leftPct}%`,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              transform: [{ translateY }, { scale }],
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}

// ── Circular Timer ────────────────────────────
function CircularTimer({
  progress,
  elapsed,
  target,
  isRunning,
  isBreak = false,
  size = 220,
  onPressTime,
}: {
  progress: number;
  elapsed: number;
  target: number;
  isRunning: boolean;
  isBreak?: boolean;
  size?: number;
  onPressTime?: () => void;
}) {
  const { colors } = useTheme();
  const lang = useSettingsStore((s) => s.settings.language);
  const t = getStrings(lang);

  const progressAnim = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
      glowAnim.stopAnimation();
    }
    return () => glowAnim.stopAnimation();
  }, [isRunning]);

  const breathAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(breathAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
    return () => breathAnim.stopAnimation();
  }, [isRunning]);

  const STROKE_W = 10;
  const r = (size - STROKE_W * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const ringColor = isBreak ? colors.accentGreen : colors.primary;
  const remaining = Math.max(0, target - elapsed);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] });

  const containerScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02],
  });

  // Rotation unwinds from -90deg to -450deg as timer goes down (progress 1 -> 0)
  // Which maps to: at progress = 1, svgRotate = 0deg, at progress = 0, svgRotate = -360deg
  const svgRotate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-360deg', '0deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: containerScale }],
      }}
    >
      {isRunning && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: ringColor + '18',
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          }}
        />
      )}

      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: svgRotate }] }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke={colors.surface2} strokeWidth={STROKE_W} fill="none" />
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={r}
            stroke={isRunning ? ringColor : colors.textTertiary}
            strokeWidth={STROKE_W}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${cx}, ${cy}`}
          />
        </Svg>
      </Animated.View>

      <TouchableOpacity
        onPress={onPressTime}
        disabled={isRunning || !onPressTime}
        activeOpacity={0.75}
        style={{ alignItems: 'center', justifyContent: 'center', padding: Spacing.sm }}
      >
        <AppText style={{ fontSize: 50, fontFamily: FontFamily.bold, color: colors.textPrimary, letterSpacing: -2 }}>
          {formatSeconds(remaining)}
        </AppText>
        <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
          {elapsed > 0
            ? `${formatSeconds(elapsed)} elapsed`
            : isRunning
              ? (isBreak ? 'On break…' : 'Focusing…')
              : t.tapToAdjust}
        </AppText>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Session Controls ──────────────────────────
function SessionControls({
  timerState,
  onStart,
  onPause,
  onResume,
  onStop,
}: {
  timerState: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  const { colors } = useTheme();

  if (timerState === 'idle' || timerState === 'completed' || timerState === 'break_complete') {
    return (
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.warn); onStart(); }}
        style={[styles.startBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={28} color="#fff" />
        <AppText style={{ color: '#fff', fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, marginLeft: Spacing.sm }}>
          Start Session
        </AppText>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.controlsRow}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.warn); onStop(); }}
        style={[styles.controlBtn, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: 1 }]}
        activeOpacity={0.75}
      >
        <Ionicons name="stop" size={22} color={colors.error} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
          timerState === 'running' ? onPause() : onResume();
        }}
        style={[styles.controlBtnLg, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Ionicons name={timerState === 'running' ? 'pause' : 'play'} size={28} color="#fff" />
      </TouchableOpacity>

      <View style={[styles.controlBtn, { backgroundColor: 'transparent' }]} />
    </View>
  );
}

// ── Round Pill ────────────────────────────────
function RoundPill({ round, interval, isBreak }: { round: number; interval: number; isBreak: boolean }) {
  const { colors } = useTheme();
  const isLongBreakNext = round > 0 && round % interval === 0;

  return (
    <View style={[styles.roundPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      {Array.from({ length: interval }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.roundDot,
            {
              backgroundColor: i < round
                ? (isBreak ? colors.accentGreen : colors.primary)
                : colors.surface3,
            },
          ]}
        />
      ))}
      <AppText variant="caption" color={colors.textTertiary} style={{ marginLeft: 6 }}>
        Round {round} {isLongBreakNext ? '· Long break next' : ''}
      </AppText>
    </View>
  );
}

// ── Session Completion Modal ───────────────────
function CompletionModal({
  visible,
  onStartBreak,
  onSkipBreak,
  sessionElapsedSeconds,
  breakTargetSeconds,
  pomodoroRound,
  longBreakInterval,
  mode,
  lang,
}: {
  visible: boolean;
  onStartBreak: () => void;
  onSkipBreak: () => void;
  sessionElapsedSeconds: number;
  breakTargetSeconds: number;
  pomodoroRound: number;
  longBreakInterval: number;
  mode: FocusMode;
  lang: string;
}) {
  const { colors } = useTheme();

  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const textAnim      = useRef(new Animated.Value(0)).current;
  const buttonsAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    checkmarkAnim.setValue(0);
    textAnim.setValue(0);
    buttonsAnim.setValue(0);
    pulseAnim.setValue(1);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(console.warn);

    // Staggered footer-to-header sequence: buttons first, then text, then checkmark
    Animated.sequence([
      Animated.stagger(60, [
        Animated.timing(buttonsAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
    ]).start();

    return () => pulseAnim.stopAnimation();
  }, [visible]);

  const checkmarkOpacity = checkmarkAnim;
  const checkmarkTranslateY = checkmarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });
  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const textOpacity = textAnim;
  const textTranslateY = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const buttonsOpacity = buttonsAnim;
  const buttonsTranslateY = buttonsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const durationLabel = (() => {
    if (sessionElapsedSeconds < 90) {
      const s = Math.round(sessionElapsedSeconds);
      return lang === 'am' ? `${s} ሰከንድ` : `${s} Second${s !== 1 ? 's' : ''}`;
    }
    const m = Math.round(sessionElapsedSeconds / 60);
    return lang === 'am' ? `${m} ደቂቃ` : `${m} Minute${m !== 1 ? 's' : ''}`;
  })();

  const breakMins = Math.round(breakTargetSeconds / 60);
  const isLongBreak = pomodoroRound > 0 && pomodoroRound % longBreakInterval === 0;
  const breakLabel = isLongBreak
    ? (lang === 'am' ? `የረጅም ዕረፍት — ${breakMins} ደቂቃ` : `Long Break — ${breakMins} min`)
    : (lang === 'am' ? `አጭር ዕረፍት — ${breakMins} ደቂቃ` : `Short Break — ${breakMins} min`);

  const showBreakButtons = mode === 'pomodoro';

  return (
    <AppModal visible={visible} onClose={onSkipBreak} title="">
      <View style={styles.celebrationContainer}>
        <RisingSparkles active={visible} />

        <Animated.View
          style={[
            styles.haloRing,
            {
              borderColor: '#FFD700',
              backgroundColor: '#FFD70014',
              transform: [
                { scale: Animated.multiply(checkmarkScale, pulseAnim) },
                { translateY: checkmarkTranslateY }
              ],
              opacity: checkmarkOpacity,
            },
          ]}
        />

        <Animated.View
          style={[
            styles.trophyWrapper,
            {
              transform: [
                { scale: checkmarkScale },
                { translateY: checkmarkTranslateY }
              ],
              opacity: checkmarkOpacity,
            }
          ]}
        >
          <View style={[styles.trophyInnerCircle, { backgroundColor: '#FFD70022' }]} />
          <Ionicons name="checkmark" size={64} color="#FFD700" />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY: textTranslateY }],
            opacity: textOpacity,
            alignItems: 'center',
            paddingHorizontal: Spacing.xl,
            marginTop: Spacing.xl,
          }}
        >
          <AppText style={{ fontSize: FontSize.xxl + 4, fontFamily: FontFamily.bold, color: colors.textPrimary, textAlign: 'center', letterSpacing: -0.5 }}>
            {lang === 'am' ? 'ትኩረት ተጠናቀቀ' : 'Session Complete'}
          </AppText>
          <AppText style={{ fontSize: FontSize.md, fontFamily: FontFamily.semiBold, color: '#FFD700', textAlign: 'center', marginTop: Spacing.xs, letterSpacing: 1 }}>
            {durationLabel} {lang === 'am' ? 'ትኩረት' : 'Focus'}
          </AppText>
          <AppText style={{ fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 }}>
            {lang === 'am' ? 'ጥሩ ሥራ! ዕረፍትዎን ይጀምሩ።' : 'Well done. Start your break.'}
          </AppText>
        </Animated.View>

        <Animated.View
          style={{
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsTranslateY }],
            width: '100%',
            paddingHorizontal: Spacing.lg,
            marginTop: Spacing.xl,
            gap: Spacing.sm,
          }}
        >
          {showBreakButtons ? (
            <>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.warn); onStartBreak(); }}
                activeOpacity={0.85}
                style={[styles.celebrationBtn, { backgroundColor: '#FFD700' }]}
              >
                <AppText style={{ color: '#1A1200', fontFamily: FontFamily.bold, fontSize: FontSize.md }}>
                  {lang === 'am' ? 'ዕረፍት ጀምር' : 'Start Break'}
                </AppText>
              </TouchableOpacity>

              {/* Break label pill */}
              <View style={[styles.breakLabelPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Ionicons name="cafe-outline" size={13} color={colors.textTertiary} />
                <AppText variant="caption" color={colors.textTertiary} style={{ marginLeft: 5 }}>
                  {breakLabel}
                </AppText>
              </View>

              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn); onSkipBreak(); }}
                activeOpacity={0.75}
                style={[styles.ghostBtn, { borderColor: colors.border }]}
              >
                <AppText style={{ color: colors.textSecondary, fontFamily: FontFamily.medium, fontSize: FontSize.sm }}>
                  {lang === 'am' ? 'ዕረፍት ዝለል' : 'Skip Break'}
                </AppText>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.warn); onSkipBreak(); }}
              activeOpacity={0.85}
              style={[styles.celebrationBtn, { backgroundColor: '#FFD700' }]}
            >
              <AppText style={{ color: '#1A1200', fontFamily: FontFamily.bold, fontSize: FontSize.md }}>
                {lang === 'am' ? 'አሳምሮ!' : 'Awesome!'}
              </AppText>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </AppModal>
  );
}

// ── Break Complete Modal ───────────────────────
function BreakCompleteModal({
  visible,
  onStartFocus,
  onDone,
  lang,
}: {
  visible: boolean;
  onStartFocus: () => void;
  onDone: () => void;
  lang: string;
}) {
  const { colors } = useTheme();

  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const textAnim      = useRef(new Animated.Value(0)).current;
  const buttonsAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    checkmarkAnim.setValue(0);
    textAnim.setValue(0);
    buttonsAnim.setValue(0);
    pulseAnim.setValue(1);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.warn);

    // Staggered footer-to-header sequence: buttons first, then text, then checkmark
    Animated.sequence([
      Animated.stagger(60, [
        Animated.timing(buttonsAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
    ]).start();

    return () => pulseAnim.stopAnimation();
  }, [visible]);

  const checkmarkOpacity = checkmarkAnim;
  const checkmarkTranslateY = checkmarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });
  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const textOpacity = textAnim;
  const textTranslateY = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const buttonsOpacity = buttonsAnim;
  const buttonsTranslateY = buttonsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  return (
    <AppModal visible={visible} onClose={onDone} title="">
      <View style={styles.celebrationContainer}>
        {/* Calm blue-teal sparkles for break */}
        <RisingSparkles
          active={visible}
          palette={['#22D3EE', '#67E8F9', '#A5F3FC', '#BAE6FD', '#93C5FD', '#FFFFFF']}
        />

        {/* Halo */}
        <Animated.View
          style={[
            styles.haloRing,
            {
              borderColor: colors.accentGreen,
              backgroundColor: colors.accentGreen + '12',
              transform: [
                { scale: Animated.multiply(checkmarkScale, pulseAnim) },
                { translateY: checkmarkTranslateY }
              ],
              opacity: checkmarkOpacity,
            },
          ]}
        />

        {/* Checkmark icon instead of coffee cup */}
        <Animated.View
          style={[
            styles.trophyWrapper,
            {
              transform: [
                { scale: checkmarkScale },
                { translateY: checkmarkTranslateY }
              ],
              opacity: checkmarkOpacity,
            }
          ]}
        >
          <View style={[styles.trophyInnerCircle, { backgroundColor: colors.accentGreen + '22' }]} />
          <Ionicons name="checkmark" size={64} color={colors.accentGreen} />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY: textTranslateY }],
            opacity: textOpacity,
            alignItems: 'center',
            paddingHorizontal: Spacing.xl,
            marginTop: Spacing.xl,
          }}
        >
          <AppText style={{ fontSize: FontSize.xxl + 2, fontFamily: FontFamily.bold, color: colors.textPrimary, textAlign: 'center' }}>
            {lang === 'am' ? 'ዕረፍት ተጠናቀቀ' : 'Break Complete'}
          </AppText>
          <AppText style={{ fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 }}>
            {lang === 'am' ? 'ቀጣዩን የትኩረት ክፍለ ጊዜ ይጀምሩ።' : 'Start your next focus session.'}
          </AppText>
        </Animated.View>

        <Animated.View
          style={{
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsTranslateY }],
            width: '100%',
            paddingHorizontal: Spacing.lg,
            marginTop: Spacing.xl,
            gap: Spacing.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.warn); onStartFocus(); }}
            activeOpacity={0.85}
            style={[styles.celebrationBtn, { backgroundColor: colors.accentGreen }]}
          >
            <AppText style={{ color: '#FFFFFF', fontFamily: FontFamily.bold, fontSize: FontSize.md }}>
              {lang === 'am' ? 'ትኩረት ጀምር' : 'Start Focus'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn); onDone(); }}
            activeOpacity={0.75}
            style={[styles.ghostBtn, { borderColor: colors.border }]}
          >
            <AppText style={{ color: colors.textSecondary, fontFamily: FontFamily.medium, fontSize: FontSize.sm }}>
              {lang === 'am' ? 'አሁን ላቁም' : 'Done for Now'}
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </AppModal>
  );
}

// ── Time Edit Modal ────────────────────────────
function TimeEditModal({
  visible,
  onClose,
  initialMinutes,
  onSave,
  lang,
}: {
  visible: boolean;
  onClose: () => void;
  initialMinutes: number;
  onSave: (mins: number) => void;
  lang: 'en' | 'am';
}) {
  const { colors } = useTheme();
  const [mins, setMins] = useState(String(initialMinutes));
  const t = getStrings(lang);

  useEffect(() => { if (visible) setMins(String(initialMinutes)); }, [visible, initialMinutes]);

  const handleSave = () => {
    const val = parseInt(mins, 10);
    if (!isNaN(val) && val > 0 && val <= 300) { onSave(val); onClose(); }
  };

  const adjustMinutes = (delta: number) => {
    const v = Math.max(1, Math.min(300, (parseInt(mins, 10) || 0) + delta));
    setMins(String(v));
  };

  const parsedVal = parseInt(mins, 10);
  const isInvalid = mins.trim() === '' || isNaN(parsedVal) || parsedVal <= 0 || parsedVal > 300;

  return (
    <AppModal visible={visible} onClose={onClose} title={t.adjustTime}>
      <View style={{ paddingVertical: Spacing.md, alignItems: 'center' }}>
        <AppText variant="body" color={colors.textSecondary} style={{ marginBottom: Spacing.lg }}>
          {lang === 'am' ? 'የትኩረት ጊዜ ቆይታን በደቂቃ ያስገቡ' : 'Enter focus duration in minutes'}
        </AppText>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl }}>
          <TouchableOpacity onPress={() => adjustMinutes(-5)} style={styles.adjustBtn}>
            <Ionicons name="remove" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ width: 100 }}>
            <AppInput
              value={mins} onChangeText={setMins} keyboardType="number-pad" maxLength={3}
              style={{ textAlign: 'center', fontSize: FontSize.xxl, height: 60 }}
              error={isInvalid ? (lang === 'am' ? 'ከ1 - 300 ደቂቃ' : 'Must be 1 - 300') : undefined}
            />
          </View>
          <TouchableOpacity onPress={() => adjustMinutes(5)} style={styles.adjustBtn}>
            <Ionicons name="add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', justifyContent: 'center', marginBottom: Spacing.xl }}>
          {[10, 15, 25, 45, 60, 90].map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() => setMins(String(preset))}
              style={{
                paddingHorizontal: Spacing.md, paddingVertical: 8,
                borderRadius: Radius.full,
                backgroundColor: parsedVal === preset ? colors.primaryLight : colors.surface2,
                borderColor: parsedVal === preset ? colors.primary : colors.border,
                borderWidth: 1,
              }}
            >
              <AppText style={{ color: parsedVal === preset ? colors.primary : colors.textSecondary, fontFamily: FontFamily.medium }}>
                {preset} {t.minutes}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <AppButton label={t.save} variant="primary" disabled={isInvalid} onPress={handleSave} style={{ width: '100%', paddingVertical: 14 }} />
      </View>
    </AppModal>
  );
}

// ── Main Focus Screen ─────────────────────────
export function FocusScreen() {
  const { colors } = useTheme();
  const lang = useSettingsStore((s) => s.settings.language);
  const t = getStrings(lang);
  const settings = useSettingsStore((s) => s.settings);

  const setPomodoroWorkMinutes = useSettingsStore((s) => s.setPomodoroWorkMinutes);
  const setDeepFocusMinutes    = useSettingsStore((s) => s.setDeepFocusMinutes);
  const setRevisionMinutes     = useSettingsStore((s) => s.setRevisionMinutes);

  const {
    activeSession, timerState, selectedMode, selectedSubject, ambientSound,
    streak, getTodayFocusSeconds, getTodaySessions,
    startSession, pauseTimer, resumeTimer, stopTimer, tickTimer,
    setSelectedMode, setSelectedSubject, setAmbientSound,
    checkStreak, dismissCelebration, sessions,
    pomodoroRound, breakTargetSeconds, breakElapsed,
    startBreak, tickBreak, skipBreak, startNewRound,
  } = useFocusStore();

  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const longBreakInterval = settings.pomodoroLongBreakInterval ?? 4;

  const handleSaveCustomTime = (mins: number) => {
    if (selectedMode === 'pomodoro') setPomodoroWorkMinutes(mins);
    else if (selectedMode === 'deep') setDeepFocusMinutes(mins);
    else if (selectedMode === 'revision') setRevisionMinutes(mins);
  };

  useEffect(() => { checkStreak(); }, []);

  // Unified tick — drives both focus and break timers
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    if (timerState === 'running') {
      tickRef.current = setInterval(() => tickTimer(), 1000);
    } else if (timerState === 'break') {
      tickRef.current = setInterval(() => tickBreak(), 1000);
    }

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timerState]);

  function getModeTarget(): number {
    switch (selectedMode) {
      case 'pomodoro': return settings.pomodoroWorkMinutes * 60;
      case 'deep':     return settings.deepFocusMinutes * 60;
      case 'revision': return settings.revisionMinutes * 60;
    }
  }

  function handleStart() {
    startSession(selectedMode, getModeTarget(), selectedSubject ?? undefined);
  }

  // Focus ring progress: 1 (full) → 0 (empty)
  const focusTarget   = activeSession?.targetDuration ?? getModeTarget();
  const focusElapsed  = activeSession?.elapsed ?? 0;
  const focusProgress = focusTarget > 0 ? 1 - focusElapsed / focusTarget : 1;

  // Break ring progress: 1 (full) → 0 (empty)
  const breakProgress = breakTargetSeconds > 0 ? 1 - breakElapsed / breakTargetSeconds : 1;

  const todaySeconds    = getTodayFocusSeconds();
  const todaySessions   = getTodaySessions();
  const modeConfig      = FOCUS_MODES.find((m) => m.key === selectedMode)!;
  const subjectConfig   = SUBJECTS.find((s) => s.key === selectedSubject);
  const dailyGoal       = settings.dailyFocusGoalHours * 3600;
  const lastSessionElapsed = sessions[0]?.elapsed ?? 0;

  const isBreakMode = timerState === 'break';

  return (
    <SafeAreaWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <AppText variant="headline" color={colors.textPrimary}>
            {isBreakMode ? (lang === 'am' ? 'ዕረፍት ጊዜ' : 'Break Time') : t.focusTimer}
          </AppText>
          {subjectConfig && !isBreakMode && (
            <View style={[styles.subjectBadge, { backgroundColor: subjectConfig.color + '22', borderRadius: Radius.full }]}>
              <View style={[styles.subjectDot, { backgroundColor: subjectConfig.color }]} />
              <AppText style={{ color: subjectConfig.color, fontSize: FontSize.sm, fontFamily: FontFamily.medium }}>
                {subjectConfig.label}
              </AppText>
            </View>
          )}
          {/* Show round pill when a pomodoro session is ongoing */}
          {(timerState === 'running' || timerState === 'paused' || isBreakMode) && selectedMode === 'pomodoro' && (
            <RoundPill round={pomodoroRound} interval={longBreakInterval} isBreak={isBreakMode} />
          )}
        </View>

        {/* ── Mode Selector (idle only) ── */}
        {timerState === 'idle' && (
          <View style={styles.modeRow}>
            {FOCUS_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn); setSelectedMode(mode.key as FocusMode); }}
                style={[
                  styles.modePill,
                  {
                    backgroundColor: selectedMode === mode.key ? colors.primary : colors.surface2,
                    borderColor:     selectedMode === mode.key ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name={mode.icon as any} size={14} color={selectedMode === mode.key ? '#fff' : colors.textTertiary} />
                <AppText style={{ fontSize: FontSize.sm, fontFamily: FontFamily.semiBold, color: selectedMode === mode.key ? '#fff' : colors.textTertiary, marginLeft: 4 }}>
                  {mode.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Timer Display ── */}
        <View style={styles.timerSection}>
          <CircularTimer
            progress={isBreakMode ? breakProgress : focusProgress}
            elapsed={isBreakMode ? breakElapsed : focusElapsed}
            target={isBreakMode ? breakTargetSeconds : focusTarget}
            isRunning={timerState === 'running' || isBreakMode}
            isBreak={isBreakMode}
            onPressTime={timerState === 'idle' ? () => setShowTimeEditor(true) : undefined}
          />
          {timerState === 'idle' && (
            <AppText variant="bodySm" color={colors.textTertiary} align="center" style={{ marginTop: Spacing.sm }}>
              {modeConfig.description}
            </AppText>
          )}
        </View>

        {/* ── Controls ── */}
        <View style={styles.controlsSection}>
          {isBreakMode ? (
            // During break: show "End Break" button only
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.warn); skipBreak(); }}
              style={[styles.ghostBtnLg, { borderColor: colors.border }]}
              activeOpacity={0.75}
            >
              <Ionicons name="stop-circle-outline" size={20} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <AppText style={{ color: colors.textSecondary, fontFamily: FontFamily.medium, fontSize: FontSize.md }}>
                {lang === 'am' ? 'ዕረፍት አቁም' : 'End Break Early'}
              </AppText>
            </TouchableOpacity>
          ) : (
            <SessionControls
              timerState={timerState}
              onStart={handleStart}
              onPause={pauseTimer}
              onResume={resumeTimer}
              onStop={stopTimer}
            />
          )}
        </View>

        {/* ── Subject Selector (idle only) ── */}
        {timerState === 'idle' && (
          <View style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.md }}>
            <AppSectionHeader title="Study Subject" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn); setSelectedSubject(null); }}
                style={[styles.subjChip, { backgroundColor: !selectedSubject ? colors.primaryLight : colors.surface2, borderColor: !selectedSubject ? colors.primary : colors.border }]}
              >
                <AppText style={{ color: !selectedSubject ? colors.primary : colors.textTertiary, fontSize: FontSize.sm }}>General</AppText>
              </TouchableOpacity>
              {SUBJECTS.slice(0, 8).map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn); setSelectedSubject(s.key as SubjectKey); }}
                  style={[styles.subjChip, { backgroundColor: selectedSubject === s.key ? s.color + '22' : colors.surface2, borderColor: selectedSubject === s.key ? s.color : colors.border }]}
                >
                  <AppText style={{ color: selectedSubject === s.key ? s.color : colors.textTertiary, fontSize: FontSize.sm }}>{s.label}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <AppCard style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <AppText variant="title" color={colors.primary}>{formatHours(todaySeconds)}</AppText>
            </View>
            <AppText variant="caption" color={colors.textTertiary}>Today</AppText>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
              <AppText variant="title" color={colors.accentGreen}>{todaySessions.length}</AppText>
            </View>
            <AppText variant="caption" color={colors.textTertiary}>Sessions</AppText>
          </AppCard>
          <AppCard style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="flame" size={16} color={colors.accentOrange} />
              <AppText variant="title" color={colors.accentOrange}>{streak.currentStreak}</AppText>
            </View>
            <AppText variant="caption" color={colors.textTertiary}>Streak</AppText>
          </AppCard>
        </View>

        {/* ── Daily Goal ── */}
        <View style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.md }}>
          <AppProgressBar
            progress={todaySeconds / dailyGoal}
            color={colors.primary}
            height={8}
            label={`${formatHours(todaySeconds)} / ${settings.dailyFocusGoalHours}h daily goal`}
          />
        </View>

        {/* ── Ambient Sound (idle only) ── */}
        {timerState === 'idle' && (
          <View style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.xl }}>
            <AppSectionHeader title="Ambient Sound" style={{ marginBottom: Spacing.sm }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {AMBIENT_SOUNDS.map((sound) => (
                <TouchableOpacity
                  key={sound.key}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn); setAmbientSound(sound.key); }}
                  style={[styles.soundChip, { backgroundColor: ambientSound === sound.key ? colors.primaryLight : colors.surface2, borderColor: ambientSound === sound.key ? colors.primary : colors.border }]}
                >
                  <Ionicons name={sound.icon as any} size={14} color={ambientSound === sound.key ? colors.primary : colors.textTertiary} />
                  <AppText style={{ color: ambientSound === sound.key ? colors.primary : colors.textTertiary, fontSize: FontSize.xs, marginLeft: 4, fontFamily: FontFamily.medium }}>
                    {sound.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── Completion Modal ── */}
      <CompletionModal
        visible={timerState === 'completed'}
        onStartBreak={() => startBreak(breakTargetSeconds)}
        onSkipBreak={dismissCelebration}
        sessionElapsedSeconds={lastSessionElapsed}
        breakTargetSeconds={breakTargetSeconds}
        pomodoroRound={pomodoroRound}
        longBreakInterval={longBreakInterval}
        mode={selectedMode}
        lang={lang}
      />

      {/* ── Break Complete Modal ── */}
      <BreakCompleteModal
        visible={timerState === 'break_complete'}
        onStartFocus={startNewRound}
        onDone={dismissCelebration}
        lang={lang}
      />

      {/* ── Time Edit Modal ── */}
      <TimeEditModal
        visible={showTimeEditor}
        onClose={() => setShowTimeEditor(false)}
        initialMinutes={Math.round(focusTarget / 60)}
        onSave={handleSaveCustomTime}
        lang={lang}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxl },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  modeRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.lg },
  modePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, gap: 4,
  },
  timerSection:    { alignItems: 'center', paddingVertical: Spacing.lg },
  controlsSection: { alignItems: 'center', marginBottom: Spacing.xl },
  startBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: Spacing.xxl, borderRadius: Radius.xl },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  controlBtn:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  controlBtnLg: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  ghostBtnLg: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl, borderWidth: 1,
  },
  subjChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, marginRight: Spacing.sm },
  soundChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, marginRight: Spacing.sm },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  subjectBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, gap: 6 },
  subjectDot: { width: 8, height: 8, borderRadius: 4 },
  adjustBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#444',
  },

  // ── Pomodoro round pill ──
  roundPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  roundDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 2 },

  // ── Celebration ──
  celebrationContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    minHeight: 400,
    position: 'relative',
    overflow: 'hidden',
  },
  haloRing: {
    position: 'absolute',
    top: Spacing.lg,
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2,
  },
  trophyWrapper: { alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, zIndex: 2 },
  trophyInnerCircle: { position: 'absolute', width: 90, height: 90, borderRadius: 45 },
  celebrationBtn: { paddingVertical: 15, paddingHorizontal: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  ghostBtn: { paddingVertical: 13, paddingHorizontal: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  breakLabelPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1,
  },
});
