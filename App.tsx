// ─────────────────────────────────────────────
// Armimo / አርምሞ — App Entry Point
// ─────────────────────────────────────────────

import React, { useEffect, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { StyleSheet, View, AppState, AppStateStatus } from 'react-native';

import { ThemeProvider } from './src/theme/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NotificationService } from './src/notifications/NotificationService';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });
        await NotificationService.configure();
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        setFontsLoaded(true);
      }
    })();
  }, []);

  // ── AppState Transition Sync ──────────
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { useFocusStore } = require('./src/store/focusStore');
          useFocusStore.getState().syncTimerFromBackground();
        } catch (e) {
          console.warn('AppState focusStore sync error:', e);
        }

        NotificationService.syncFromStores();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial load sync after stores hydrate
    const timer = setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useFocusStore } = require('./src/store/focusStore');
        useFocusStore.getState().syncTimerFromBackground();
      } catch (e) {
        console.warn('Initial focusStore sync error:', e);
      }
      NotificationService.syncFromStores();
    }, 1500);

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
