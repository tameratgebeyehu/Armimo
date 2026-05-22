// ─────────────────────────────────────────────
// Armimo / አርምሞ — Misc UI Components
// AppDivider | AppBadge | AppChip | AppSwitch
// AppProgressBar | AppIconButton | AppFloatingButton
// AppEmptyState | AppSectionHeader
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import {
  Radius,
  Spacing,
  FontFamily,
  FontSize,
  TouchTarget,
  IconSize,
} from '../theme/tokens';

// ─── AppDivider ───────────────────────────────
export function AppDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[{ height: 1, backgroundColor: colors.border, marginVertical: Spacing.sm }, style]}
    />
  );
}

// ─── AppBadge ────────────────────────────────
type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';
interface AppBadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}
export function AppBadge({ label, variant = 'neutral', style }: AppBadgeProps) {
  const { colors } = useTheme();
  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: colors.primaryLight, text: colors.primary },
    success: { bg: colors.successBg, text: colors.success },
    warning: { bg: colors.warningBg, text: colors.warning },
    error:   { bg: colors.errorBg, text: colors.error },
    neutral: { bg: colors.surface2, text: colors.textSecondary },
  };
  const vs = variantMap[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: vs.bg, borderRadius: Radius.full },
        style,
      ]}
    >
      <AppText style={{ color: vs.text, fontSize: FontSize.xs, fontFamily: FontFamily.semiBold }}>
        {label}
      </AppText>
    </View>
  );
}

// ─── AppChip ─────────────────────────────────
interface AppChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}
export function AppChip({ label, selected = false, onPress, color, style, icon }: AppChipProps) {
  const { colors } = useTheme();
  const activeBg = color ?? colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? activeBg : colors.surface2,
          borderColor: selected ? activeBg : colors.border,
          borderRadius: Radius.full,
        },
        style,
      ]}
    >
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <AppText
        style={{
          color: selected ? '#fff' : colors.textSecondary,
          fontSize: FontSize.sm,
          fontFamily: FontFamily.medium,
        }}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

// ─── AppSwitch ───────────────────────────────
interface AppSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  label?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}
export function AppSwitch({ value, onValueChange, label, hint, style }: AppSwitchProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.switchRow, style]}>
      <View style={{ flex: 1 }}>
        {label && (
          <AppText variant="bodyMedium" color={colors.textPrimary}>{label}</AppText>
        )}
        {hint && (
          <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>{hint}</AppText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surface3, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ─── AppProgressBar ──────────────────────────
interface AppProgressBarProps {
  progress: number; // 0–1
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
  label?: string;
}
export function AppProgressBar({
  progress,
  color,
  height = 6,
  style,
  label,
}: AppProgressBarProps) {
  const { colors, radius } = useTheme();
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    <View style={style}>
      {label && (
        <AppText variant="caption" color={colors.textTertiary} style={{ marginBottom: 4 }}>
          {label}
        </AppText>
      )}
      <View
        style={{
          height,
          backgroundColor: colors.surface2,
          borderRadius: radius.full,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height,
            width: `${clampedProgress * 100}%`,
            backgroundColor: color ?? colors.primary,
            borderRadius: radius.full,
          }}
        />
      </View>
    </View>
  );
}

// ─── AppIconButton ───────────────────────────
interface AppIconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'filled' | 'ghost';
}
export function AppIconButton({
  name,
  onPress,
  size = IconSize.md,
  color,
  style,
  variant = 'default',
}: AppIconButtonProps) {
  const { colors } = useTheme();
  const iconColor = color ?? colors.textSecondary;
  const bg =
    variant === 'filled'
      ? colors.surface2
      : variant === 'ghost'
      ? 'transparent'
      : 'transparent';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.iconBtn,
        {
          backgroundColor: bg,
          borderRadius: Radius.md,
          width: TouchTarget.min,
          height: TouchTarget.min,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={iconColor} />
    </TouchableOpacity>
  );
}

// ─── AppFloatingButton ────────────────────────
interface AppFloatingButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  style?: StyleProp<ViewStyle>;
}
export function AppFloatingButton({
  onPress,
  icon = 'add',
  label,
  style,
}: AppFloatingButtonProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          borderRadius: label ? Radius.xl : Radius.full,
          paddingHorizontal: label ? Spacing.lg : 0,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={24} color="#fff" />
      {label && (
        <AppText
          style={{ color: '#fff', fontFamily: FontFamily.semiBold, marginLeft: Spacing.sm }}
        >
          {label}
        </AppText>
      )}
    </TouchableOpacity>
  );
}

// ─── AppEmptyState ───────────────────────────
interface AppEmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function AppEmptyState({ icon, title, subtitle, action, style }: AppEmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.emptyState, style]}>
      {icon && (
        <View
          style={[
            styles.emptyIconWrap,
            { backgroundColor: colors.surface2, borderRadius: Radius.full },
          ]}
        >
          <Ionicons name={icon} size={IconSize.xl} color={colors.textTertiary} />
        </View>
      )}
      <AppText variant="title" color={colors.textPrimary} align="center" style={{ marginTop: Spacing.md }}>
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="body" color={colors.textTertiary} align="center" style={{ marginTop: Spacing.xs }}>
          {subtitle}
        </AppText>
      )}
      {action && <View style={{ marginTop: Spacing.lg }}>{action}</View>}
    </View>
  );
}

// ─── AppSectionHeader ────────────────────────
interface AppSectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function AppSectionHeader({ title, action, style }: AppSectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <AppText variant="titleMd" color={colors.textPrimary}>{title}</AppText>
      {action}
    </View>
  );
}

// ─── Styles ───────────────────────────────────
const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
});
