// ─────────────────────────────────────────────
// Armimo / አርምሞ — Layout Components
// ScreenWrapper | SafeAreaWrapper | ScrollContainer
// SectionContainer | CenterContainer
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Spacing } from '../theme/tokens';

// ── ScreenWrapper ─────────────────────────────
interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  keyboardAvoiding?: boolean;
}
export function ScreenWrapper({
  children,
  style,
  noPadding = false,
  keyboardAvoiding = false,
}: ScreenWrapperProps) {
  const { colors, isDark } = useTheme();
  const content = (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingHorizontal: noPadding ? 0 : Spacing.md,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {children}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }
  return content;
}

// ── SafeAreaWrapper ────────────────────────────
interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}
export function SafeAreaWrapper({
  children,
  style,
  edges = ['top', 'bottom'],
}: SafeAreaWrapperProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

// ── ScrollContainer ───────────────────────────
interface ScrollContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  padded?: boolean;
  refreshControl?: React.ReactElement;
}
export function ScrollContainer({
  children,
  style,
  contentStyle,
  padded = true,
  refreshControl,
}: ScrollContainerProps) {
  return (
    <ScrollView
      style={[styles.scroll, style]}
      contentContainerStyle={[
        { paddingHorizontal: padded ? Spacing.md : 0, paddingBottom: Spacing.xxl },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

// ── SectionContainer ──────────────────────────
interface SectionContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gap?: number;
}
export function SectionContainer({ children, style, gap = Spacing.md }: SectionContainerProps) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

// ── CenterContainer ───────────────────────────
interface CenterContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  flex?: boolean;
}
export function CenterContainer({ children, style, flex = true }: CenterContainerProps) {
  return (
    <View
      style={[
        { alignItems: 'center', justifyContent: 'center', flex: flex ? 1 : undefined },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
});
