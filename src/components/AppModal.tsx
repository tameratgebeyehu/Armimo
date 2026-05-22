// ─────────────────────────────────────────────
// Armimo / አርምሞ — AppModal Component
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Radius, Spacing, ZIndex } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  fullHeight?: boolean;
}

export function AppModal({
  visible,
  onClose,
  title,
  children,
  scrollable = false,
  contentStyle,
  fullHeight = false,
}: AppModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [isAtBottom, setIsAtBottom] = useState(false);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const lang = useSettingsStore((s) => s.settings.language);

  const hasMoreContent = contentHeight > layoutHeight + 10;
  const showScrollHint = scrollable && hasMoreContent && !isAtBottom;

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 30;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsAtBottom(isCloseToBottom);
  };

  const sheetStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: insets.bottom + Spacing.md,
    maxHeight: '85%',
    ...(fullHeight ? { flex: 1 } : {}),
  };

  const Content = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        showsVerticalScrollIndicator: true,
        keyboardShouldPersistTaps: 'handled' as const,
        contentContainerStyle: { paddingBottom: Spacing.xl },
        scrollEventThrottle: 16,
        onScroll: handleScroll,
        onLayout: (e: any) => setLayoutHeight(e.nativeEvent.layout.height),
        onContentSizeChange: (w: number, h: number) => setContentHeight(h),
      }
    : {};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[sheetStyle, contentStyle]}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          {title && (
            <View
              style={[
                styles.header,
                { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
            >
              <AppText variant="title" color={colors.textPrimary}>
                {title}
              </AppText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Body */}
          <Content {...contentProps} style={[styles.body, scrollable ? { flexShrink: 1 } : {}]}>
            {children}
          </Content>

          {/* Scroll Hint */}
          {showScrollHint && (
            <View style={[styles.scrollHint, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
              <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                {lang === 'am' ? 'ለማየት ወደ ታች ይሸብልሉ' : 'Scroll for more'}
              </AppText>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: ZIndex.modal,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeBtn: { padding: 4 },
  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  scrollHint: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: ZIndex.modal + 1,
  },
});
