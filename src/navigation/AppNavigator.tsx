// ─────────────────────────────────────────────
// Armimo / አርምሞ — Navigation Setup
// ─────────────────────────────────────────────

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { CustomTabBar } from '../components/CustomTabBar';
import { useTheme } from '../theme/ThemeProvider';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import { FocusScreen } from '../screens/focus/FocusScreen';
import { TimetableScreen } from '../screens/timetable/TimetableScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { NotificationSettingsScreen } from '../screens/settings/NotificationSettingsScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';

// Store
import { useSettingsStore } from '../store/settingsStore';

import {
  RootStackParamList,
  RootTabParamList,
  TaskStackParamList,
  FocusStackParamList,
  TimetableStackParamList,
  AnalyticsStackParamList,
  SettingsStackParamList,
} from '../types';

const RootStack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const TaskStack = createStackNavigator<TaskStackParamList>();
const FocusStack = createStackNavigator<FocusStackParamList>();
const TimetableStack = createStackNavigator<TimetableStackParamList>();
const AnalyticsStack = createStackNavigator<AnalyticsStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// ── Stack Navigators ──────────────────────────
function TaskNavigator() {
  return (
    <TaskStack.Navigator screenOptions={{ headerShown: false }}>
      <TaskStack.Screen name="TasksList" component={TasksScreen} />
    </TaskStack.Navigator>
  );
}

function FocusNavigator() {
  return (
    <FocusStack.Navigator screenOptions={{ headerShown: false }}>
      <FocusStack.Screen name="FocusMain" component={FocusScreen} />
    </FocusStack.Navigator>
  );
}

function TimetableNavigator() {
  return (
    <TimetableStack.Navigator screenOptions={{ headerShown: false }}>
      <TimetableStack.Screen name="TimetableMain" component={TimetableScreen} />
    </TimetableStack.Navigator>
  );
}

function AnalyticsNavigator() {
  return (
    <AnalyticsStack.Navigator screenOptions={{ headerShown: false }}>
      <AnalyticsStack.Screen name="AnalyticsMain" component={AnalyticsScreen} />
    </AnalyticsStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </SettingsStack.Navigator>
  );
}

// ── Root Tab Navigator ────────────────────────
function RootNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TaskNavigator} />
      <Tab.Screen name="Focus" component={FocusNavigator} />
      <Tab.Screen name="Timetable" component={TimetableNavigator} />
      <Tab.Screen name="Analytics" component={AnalyticsNavigator} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

// ── App Navigator (root) ─────────────────────
export function AppNavigator() {
  const { colors } = useTheme();
  const onboardingCompleted = useSettingsStore((s) => s.settings.onboardingCompleted);

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingCompleted ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <RootStack.Screen name="Main" component={RootNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
