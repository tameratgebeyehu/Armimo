// ─────────────────────────────────────────────
// Armimo / አርምሞ — Custom Confirm & Alert Dialog
// ─────────────────────────────────────────────

import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Radius, Spacing } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

interface AppConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  alertMode?: boolean; // If true, only show one action button
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

const { width } = Dimensions.get('window');

export function AppConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDestructive = false,
  alertMode = false,
  icon,
  iconColor,
}: AppConfirmDialogProps) {
  const { colors, radius } = useTheme();

  const activeIcon = icon || (isDestructive ? 'warning-outline' : 'information-circle-outline');
  const activeIconColor = iconColor || (isDestructive ? colors.error : colors.primary);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xl,
            },
          ]}
        >
          {/* Header Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDestructive ? colors.errorBg : colors.primaryLight,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name={activeIcon} size={28} color={activeIconColor} />
          </View>

          {/* Title */}
          <AppText variant="title" color={colors.textPrimary} align="center" style={styles.title}>
            {title}
          </AppText>

          {/* Message */}
          <AppText variant="body" color={colors.textSecondary} align="center" style={styles.message}>
            {message}
          </AppText>

          {/* Action Buttons */}
          {alertMode ? (
            <AppButton
              label={confirmLabel || 'OK'}
              variant="primary"
              onPress={onConfirm}
              style={styles.singleButton}
            />
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onCancel}
                style={[
                  styles.btnSecondary,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <AppText style={{ color: colors.textSecondary, fontWeight: '600' }}>
                  {cancelLabel || 'Cancel'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onConfirm}
                style={[
                  styles.btnPrimary,
                  {
                    backgroundColor: isDestructive ? colors.error : colors.primary,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <AppText style={{ color: '#fff', fontWeight: '600' }}>
                  {confirmLabel || 'Confirm'}
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialogContainer: {
    width: Math.min(width - Spacing.xl * 2, 340),
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  title: {
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  message: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
    paddingHorizontal: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  singleButton: {
    width: '100%',
  },
  btnPrimary: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
