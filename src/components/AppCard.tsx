// ─────────────────────────────────────────────
// Armimo / አርምሞ — AppCard Component
// ─────────────────────────────────────────────

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Radius, Spacing, Shadows } from '../theme/tokens';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  noBorder?: boolean;
}

export function AppCard({
  children,
  onPress,
  style,
  padded = true,
  elevated = false,
  noBorder = false,
}: AppCardProps) {
  const { colors, isDark } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: noBorder ? 0 : 1,
    borderColor: colors.cardBorder,
    padding: padded ? Spacing.md : 0,
    ...(elevated ? (isDark ? Shadows.mdDark : Shadows.md) : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
