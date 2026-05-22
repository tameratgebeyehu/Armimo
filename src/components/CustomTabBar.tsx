// ─────────────────────────────────────────────
// Armimo / አርምሞ — CustomTabBar Component
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Spacing, FontSize, Shadows } from '../theme/tokens';

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home:       { active: 'home', inactive: 'home-outline' },
  Tasks:      { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  Focus:      { active: 'timer', inactive: 'timer-outline' },
  Timetable:  { active: 'calendar', inactive: 'calendar-outline' },
  Analytics:  { active: 'bar-chart', inactive: 'bar-chart-outline' },
  Settings:   { active: 'settings', inactive: 'settings-outline' },
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 4,
          ...(isDark ? {} : Shadows.md),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const isFocused = state.index === index;
        const icons = TAB_ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.75}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
          >
            {/* Active indicator dot */}
            {isFocused && (
              <View style={[styles.activeDot, { backgroundColor: colors.tabBarActive }]} />
            )}

            <Ionicons
              name={isFocused ? icons.active : icons.inactive}
              size={22}
              color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
            />
            <AppText
              style={{
                fontSize: FontSize.xs,
                color: isFocused ? colors.tabBarActive : colors.tabBarInactive,
                marginTop: 2,
                fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }}
            >
              {route.name}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: -2,
  },
});
