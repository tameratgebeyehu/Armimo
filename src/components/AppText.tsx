// ─────────────────────────────────────────────
// Armimo / አርምሞ — AppText Component
// ─────────────────────────────────────────────

import React from 'react';
import { Text, TextStyle, TextProps, StyleProp, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, FontFamily } from '../theme/tokens';

type TypographyVariant = keyof typeof Typography;
type FontWeightKey = 'regular' | 'medium' | 'semiBold' | 'bold';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: FontWeightKey;
  italic?: boolean;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function AppText({
  variant = 'body',
  color,
  align,
  weight,
  italic = false,
  children,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const preset = Typography[variant];

  const fontFamily = weight
    ? FontFamily[weight]
    : (preset as any).fontFamily ?? FontFamily.regular;

  const flatStyle = StyleSheet.flatten(style) || {};

  const textStyle: TextStyle = {
    ...(preset as TextStyle),
    color: color ?? colors.textPrimary,
    textAlign: align,
    fontFamily,
    fontStyle: italic ? 'italic' : 'normal',
  };

  if (flatStyle.fontSize && !flatStyle.lineHeight) {
    delete textStyle.lineHeight;
  }

  return (
    <Text style={[textStyle, style]} {...rest}>
      {children}
    </Text>
  );
}
