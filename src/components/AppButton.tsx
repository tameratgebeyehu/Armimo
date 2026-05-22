// ─────────────────────────────────────────────
// Armimo / አርምሞ — AppButton Component
// ─────────────────────────────────────────────

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Radius, Spacing, TouchTarget, FontFamily, FontSize } from '../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  textStyle,
  ...rest
}: AppButtonProps) {
  const { colors, radius } = useTheme();

  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: { bg: colors.primary, text: colors.textInverse },
    secondary: { bg: colors.surface2, text: colors.textPrimary, border: colors.border },
    ghost: { bg: 'transparent', text: colors.primary },
    danger: { bg: colors.error, text: '#fff' },
    success: { bg: colors.accentGreen, text: '#fff' },
  };

  const sizeStyles: Record<ButtonSize, { height: number; px: number; fontSize: number }> = {
    sm: { height: 36, px: Spacing.md, fontSize: FontSize.sm },
    md: { height: TouchTarget.md, px: Spacing.lg, fontSize: FontSize.base },
    lg: { height: TouchTarget.lg, px: Spacing.xl, fontSize: FontSize.lg },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border ?? 'transparent',
          borderWidth: vs.border ? 1 : 0,
          borderRadius: radius.md,
          height: ss.height,
          paddingHorizontal: ss.px,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <AppText
            style={[
              {
                color: vs.text,
                fontSize: ss.fontSize,
                fontFamily: FontFamily.semiBold,
              },
              textStyle,
            ]}
          >
            {label}
          </AppText>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
});
