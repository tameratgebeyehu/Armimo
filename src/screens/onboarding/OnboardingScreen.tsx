// ─────────────────────────────────────────────
// Armimo / አርምሞ — Onboarding Screen & Interactive Setup
// ─────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Spacing, Radius, FontSize, FontFamily } from '../../theme/tokens';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { useSettingsStore } from '../../store/settingsStore';
import { getStrings } from '../../localization/strings';
import { SubjectKey, FocusMode, LanguageCode, ThemeMode } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Onboarding Feature Slides Data ────────────────
interface FeatureSlide {
  id: string;
  icon: string;
  iconColor: string;
  titleKey: 'onboardingFocusTitle' | 'onboardingScheduleTitle' | 'onboardingStreakTitle';
  descKey: 'onboardingFocusDesc' | 'onboardingScheduleDesc' | 'onboardingStreakDesc';
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: 'focus',
    icon: 'time',
    iconColor: '#3B82F6', // Blue
    titleKey: 'onboardingFocusTitle',
    descKey: 'onboardingFocusDesc',
  },
  {
    id: 'schedule',
    icon: 'calendar',
    iconColor: '#4CAF7D', // Accent Green
    titleKey: 'onboardingScheduleTitle',
    descKey: 'onboardingScheduleDesc',
  },
  {
    id: 'streak',
    icon: 'flame',
    iconColor: '#E8884A', // Accent Orange
    titleKey: 'onboardingStreakTitle',
    descKey: 'onboardingStreakDesc',
  },
];

export function OnboardingScreen() {
  const { colors, isDark, setTheme } = useTheme();
  const { settings, setLanguage, setThemeMode, setDailyFocusGoalHours, setOnboardingCompleted } =
    useSettingsStore();

  const t = getStrings(settings.language);

  // Flow step state: 0 = Lang/Theme selection, 1 = Feature Slides, 2 = Daily Goal Selector
  const [step, setStep] = useState<number>(0);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [selectedGoal, setSelectedGoal] = useState<number>(2); // Default to 2 hours

  // Animation values
  const floatAnim1 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const floatAnim2 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const slideContentAnim = useRef(new Animated.Value(0)).current;

  // Scroll X tracker for carousel indicators
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<FeatureSlide>>(null);

  // 1. Setup infinite background floating circles animations
  useEffect(() => {
    const createFloatingLoop = (anim: Animated.ValueXY, xRange: number[], yRange: number[], duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: { x: xRange[0], y: yRange[0] },
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: { x: xRange[1], y: yRange[1] },
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: { x: 0, y: 0 },
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createFloatingLoop(floatAnim1, [-30, 40], [20, -45], 8000);
    createFloatingLoop(floatAnim2, [45, -20], [-35, 30], 10000);
  }, []);

  // 2. Timer graphic pulse animation
  useEffect(() => {
    if (step === 1 && activeSlide === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, {
            toValue: 1.06,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulse, {
            toValue: 1.0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      timerPulse.setValue(1);
    }
  }, [step, activeSlide]);

  // 3. Slide Content animation reset/trigger
  useEffect(() => {
    if (step === 1) {
      slideContentAnim.setValue(0);
      Animated.spring(slideContentAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [step, activeSlide]);

  // Step navigation helper (with fade transition)
  const transitionToStep = (newStep: number) => {
    Animated.timing(stepFadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(newStep);
      Animated.timing(stepFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // Next slide / step trigger
  const handleNext = () => {
    if (step === 0) {
      transitionToStep(1);
    } else if (step === 1) {
      if (activeSlide < FEATURE_SLIDES.length - 1) {
        flatListRef.current?.scrollToIndex({
          index: activeSlide + 1,
          animated: true,
        });
      } else {
        transitionToStep(2);
      }
    } else if (step === 2) {
      // Commit goal setting and complete onboarding
      setDailyFocusGoalHours(selectedGoal);
      setOnboardingCompleted(true);
    }
  };

  // Skip feature slides
  const handleSkip = () => {
    transitionToStep(2);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false, // Must be false for width interpolation in page dots
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (index !== activeSlide) {
          setActiveSlide(index);
        }
      },
    }
  );

  // ── Render Helpers ────────────────────────────────

  // Renders Step 1: Language & Theme Selection
  const renderStep0 = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.headerArea}>
          <AppText variant="headline" align="center" style={styles.title}>
            {t.onboardingWelcome}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
            {t.onboardingWelcomeDesc}
          </AppText>
        </View>

        {/* Language Selection Card */}
        <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
          {t.onboardingChooseLang}
        </AppText>
        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setLanguage('en')}
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.surface,
                borderColor: settings.language === 'en' ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText variant="titleMd" color={settings.language === 'en' ? colors.primary : colors.textPrimary}>
              English
            </AppText>
            {settings.language === 'en' && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setLanguage('am')}
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.surface,
                borderColor: settings.language === 'am' ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText variant="titleMd" color={settings.language === 'am' ? colors.primary : colors.textPrimary}>
              አማርኛ
            </AppText>
            {settings.language === 'am' && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Theme Selection Card */}
        <AppText variant="label" color={colors.textSecondary} style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          {t.onboardingChooseTheme}
        </AppText>
        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setThemeMode('light');
              setTheme('light');
            }}
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.surface,
                borderColor: settings.themeMode === 'light' ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={styles.optionContent}>
              <Ionicons name="sunny-outline" size={24} color={colors.accentOrange} />
              <AppText variant="bodyMedium" color={colors.textPrimary}>
                {t.onboardingThemeLight}
              </AppText>
            </View>
            {settings.themeMode === 'light' && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setThemeMode('dark');
              setTheme('dark');
            }}
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.surface,
                borderColor: settings.themeMode === 'dark' ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={styles.optionContent}>
              <Ionicons name="moon-outline" size={24} color={colors.primary} />
              <AppText variant="bodyMedium" color={colors.textPrimary}>
                {t.onboardingThemeDark}
              </AppText>
            </View>
            {settings.themeMode === 'dark' && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Renders Animated Illustrations for Feature Slides
  const renderSlideGraphic = (id: string) => {
    const scale = slideContentAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    const translateY = slideContentAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

    if (id === 'focus') {
      return (
        <Animated.View style={[styles.graphicContainer, { transform: [{ scale: timerPulse }, { translateY }] }]}>
          {/* Animated Pulsating Study Timer Graphic */}
          <View style={[styles.circleRing, { borderColor: colors.primary }]}>
            <View style={[styles.circleInner, { backgroundColor: colors.surface2 }]}>
              <Ionicons name="hourglass" size={44} color={colors.primary} />
              <AppText variant="headline" style={{ marginTop: Spacing.sm }}>25:00</AppText>
            </View>
          </View>
          {/* Ambient orbiting items */}
          <View style={[styles.orbitTag, { top: 20, left: 30, backgroundColor: colors.surface }]}>
            <Ionicons name="book" size={14} color={colors.accentGreen} />
            <AppText variant="caption">Study</AppText>
          </View>
          <View style={[styles.orbitTag, { bottom: 30, right: 20, backgroundColor: colors.surface }]}>
            <Ionicons name="cafe" size={14} color={colors.accentOrange} />
            <AppText variant="caption">Break</AppText>
          </View>
        </Animated.View>
      );
    }

    if (id === 'schedule') {
      return (
        <Animated.View style={[styles.graphicContainer, { transform: [{ scale }, { translateY }] }]}>
          {/* Animated Timetable Stack */}
          <View style={styles.calendarStack}>
            <AppCard style={[styles.calendarCard, { transform: [{ rotate: '-8deg' }], opacity: 0.5 }]}>
              <AppText variant="bodySm" color={colors.textTertiary}>Tuesday</AppText>
              <AppText variant="titleMd">Calculus II</AppText>
            </AppCard>
            <AppCard style={[styles.calendarCard, { transform: [{ rotate: '4deg' }], opacity: 0.8, zIndex: 2 }]}>
              <AppText variant="bodySm" color={colors.textTertiary}>Wednesday</AppText>
              <AppText variant="titleMd">Inorganic Chemistry</AppText>
            </AppCard>
            <AppCard style={[styles.calendarCard, { transform: [{ rotate: '-2deg' }], zIndex: 3 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText variant="bodySm" color={colors.accentGreen}>Today (Monday)</AppText>
                <View style={[styles.indicatorDot, { backgroundColor: colors.accentGreen }]} />
              </View>
              <AppText variant="titleMd" style={{ marginTop: 2 }}>Software Engineering</AppText>
              <AppText variant="caption" color={colors.textSecondary}>09:00 AM - 11:30 AM</AppText>
            </AppCard>
          </View>
        </Animated.View>
      );
    }

    if (id === 'streak') {
      return (
        <Animated.View style={[styles.graphicContainer, { transform: [{ scale }, { translateY }] }]}>
          {/* Glowing Flame & mini heatmap */}
          <View style={styles.streakShowcase}>
            <View style={styles.flameContainer}>
              <Ionicons name="flame" size={64} color={colors.accentOrange} />
              <AppText variant="display" color={colors.accentOrange} style={{ marginTop: Spacing.xs }}>7</AppText>
              <AppText variant="caption" color={colors.textTertiary}>DAY STREAK</AppText>
            </View>

            {/* Mini Grid representation */}
            <View style={styles.miniHeatmap}>
              {Array.from({ length: 15 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniGridCell,
                    {
                      backgroundColor:
                        i % 4 === 0
                          ? colors.surface3
                          : i % 3 === 0
                          ? colors.primary
                          : colors.primaryLight,
                      borderColor: colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      );
    }

    return null;
  };

  // Renders Step 1: Feature Carousel List Item
  const renderSlideItem = ({ item }: { item: FeatureSlide }) => {
    return (
      <View style={styles.slide}>
        {renderSlideGraphic(item.id)}

        <View style={styles.slideContent}>
          <AppText variant="title" align="center" style={styles.slideTitle}>
            {t[item.titleKey]}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center" style={styles.slideDesc}>
            {t[item.descKey]}
          </AppText>
        </View>
      </View>
    );
  };

  // Renders Step 2: Goal Configurator Screen
  const renderStep2 = () => {
    const goals = [
      { hours: 1, label: settings.language === 'am' ? '1 ሰዓት / ቀን' : '1 Hour / Day', desc: settings.language === 'am' ? 'ለጀማሪዎች ተስማሚ' : 'Light study session' },
      { hours: 2, label: settings.language === 'am' ? '2 ሰዓት / ቀን' : '2 Hours / Day', desc: settings.language === 'am' ? 'መካከለኛ የጥናት ልምድ' : 'Moderate study habit' },
      { hours: 3, label: settings.language === 'am' ? '3 ሰዓት / ቀን' : '3 Hours / Day', desc: settings.language === 'am' ? 'ምርጥ የጥናት ደረጃ' : 'Highly recommended' },
      { hours: 4, label: settings.language === 'am' ? '4 ሰዓት / ቀን' : '4 Hours / Day', desc: settings.language === 'am' ? 'ጠቅላላ ትኩረት ሰጪዎች' : 'Intense focus routine' },
    ];

    return (
      <View style={styles.stepContainer}>
        <View style={styles.headerArea}>
          <AppText variant="headline" align="center" style={styles.title}>
            {t.onboardingGoalTitle}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
            {t.onboardingGoalDesc}
          </AppText>
        </View>

        <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
          {goals.map((item) => {
            const isSelected = selectedGoal === item.hours;
            return (
              <TouchableOpacity
                key={item.hours}
                activeOpacity={0.8}
                onPress={() => setSelectedGoal(item.hours)}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.goalLeft}>
                  <View
                    style={[
                      styles.goalDotOuter,
                      { borderColor: isSelected ? colors.primary : colors.textTertiary },
                    ]}
                  >
                    {isSelected && (
                      <View style={[styles.goalDotInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View style={{ marginLeft: Spacing.sm }}>
                    <AppText variant="titleMd" color={isSelected ? colors.primary : colors.textPrimary}>
                      {item.label}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {item.desc}
                    </AppText>
                  </View>
                </View>
                <Ionicons
                  name={isSelected ? "ribbon" : "ribbon-outline"}
                  size={24}
                  color={isSelected ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient background blur circles */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            backgroundColor: colors.primary,
            transform: [
              { translateX: floatAnim1.x },
              { translateY: floatAnim1.y },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowCircle2,
          {
            backgroundColor: colors.accentGreen,
            transform: [
              { translateX: floatAnim2.x },
              { translateY: floatAnim2.y },
            ],
          },
        ]}
      />

      <Animated.View style={{ flex: 1, opacity: stepFadeAnim }}>
        {step === 0 && renderStep0()}

        {step === 1 && (
          <View style={{ flex: 1 }}>
            {/* Horizontal Swipeable Pager */}
            <FlatList
              ref={flatListRef}
              data={FEATURE_SLIDES}
              renderItem={renderSlideItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />

            {/* Custom Premium Dot Indicators */}
            <View style={styles.dotsRow}>
              {FEATURE_SLIDES.map((_, index) => {
                const inputRange = [
                  (index - 1) * SCREEN_WIDTH,
                  index * SCREEN_WIDTH,
                  (index + 1) * SCREEN_WIDTH,
                ];

                const dotWidth = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 20, 8],
                  extrapolate: 'clamp',
                });

                const dotOpacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });

                const dotBgColor = scrollX.interpolate({
                  inputRange,
                  outputRange: [colors.border, colors.primary, colors.border],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        width: dotWidth,
                        opacity: dotOpacity,
                        backgroundColor: dotBgColor,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && renderStep2()}
      </Animated.View>

      {/* Button Controls Area */}
      <View style={styles.footerControls}>
        {step === 1 && (
          <TouchableOpacity activeOpacity={0.6} onPress={handleSkip} style={styles.skipBtn}>
            <AppText variant="bodyMedium" color={colors.textSecondary}>
              {t.onboardingSkip}
            </AppText>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        <AppButton
          label={
            step === 2
              ? t.onboardingGetStarted
              : settings.language === 'am' && step === 0
              ? 'ቀጥል'
              : 'Next'
          }
          variant="primary"
          onPress={handleNext}
          style={styles.nextBtn}
          rightIcon={
            <Ionicons
              name={step === 2 ? 'checkmark-done' : 'arrow-forward'}
              size={18}
              color={colors.textInverse}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -50,
    left: -50,
    opacity: 0.08,
  },
  glowCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: 50,
    right: -80,
    opacity: 0.06,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxxl,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  optionCard: {
    flex: 1,
    height: 60,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  // Feature slide layout
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  graphicContainer: {
    height: SCREEN_HEIGHT * 0.32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  slideTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    marginBottom: Spacing.md,
  },
  slideDesc: {
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  // Dot indicators
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 24,
    gap: 8,
    marginTop: Spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  // Slide graphics styles
  circleRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  circleInner: {
    width: 152,
    height: 152,
    borderRadius: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitTag: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarStack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  calendarCard: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakShowcase: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  flameContainer: {
    alignItems: 'center',
  },
  miniHeatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 120,
    gap: 4,
    justifyContent: 'center',
  },
  miniGridCell: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 0.5,
  },
  // Goal screen card styles
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Footer
  footerControls: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    alignItems: 'center',
    height: 80,
  },
  skipBtn: {
    paddingVertical: 10,
  },
  nextBtn: {
    minWidth: 130,
  },
});
