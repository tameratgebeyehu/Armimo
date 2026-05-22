// ─────────────────────────────────────────────
// Armimo / አርምሞ — CustomHeader Component
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Spacing } from '../theme/tokens';

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
  large?: boolean;
}

export function CustomHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
  noBorder = false,
  large = false,
}: CustomHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.sm,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: noBorder ? 0 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {leftAction && <View style={styles.action}>{leftAction}</View>}

        <View style={styles.titleBlock}>
          <AppText
            variant={large ? 'headline' : 'title'}
            color={colors.textPrimary}
            numberOfLines={1}
          >
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {subtitle}
            </AppText>
          )}
        </View>

        {rightAction && <View style={styles.action}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleBlock: { flex: 1 },
  action: { minWidth: 40 },
});
