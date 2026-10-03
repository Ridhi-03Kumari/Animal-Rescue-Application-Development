import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, buttonSizes, buttonTextSizes } from '../theme';

// Every variant has a solid, saturated fill (no pale white buttons).
const VARIANTS = {
  // Deep green: main action on cream
  primary: {
    button: { backgroundColor: colors.forest, borderColor: colors.forest },
    text: { color: '#FFFFFF' },
    spinner: '#FFFFFF',
  },
  // Bright lime: main action on dark green / photos, and nav pills in header bands
  lime: {
    button: { backgroundColor: colors.lime, borderColor: colors.lime },
    text: { color: colors.deep },
    spinner: colors.deep,
  },
  // Warm orange: urgent action (report emergency)
  accent: {
    button: { backgroundColor: colors.orange, borderColor: colors.orange },
    text: { color: colors.deep },
    spinner: colors.deep,
  },
  success: {
    button: { backgroundColor: '#1F8A4C', borderColor: '#1F8A4C' },
    text: { color: '#FFFFFF' },
    spinner: '#FFFFFF',
  },
  // Transparent with a strong green outline
  outline: {
    button: { backgroundColor: 'transparent', borderColor: colors.forest },
    text: { color: colors.forest },
    spinner: colors.forest,
  },
  // Sage fill: nav pills, chips and secondary actions on cream
  light: {
    button: { backgroundColor: colors.sageDeep, borderColor: colors.sageDeep },
    text: { color: colors.deep },
    spinner: colors.deep,
  },
  // Coral red: decline / destructive
  danger: {
    button: { backgroundColor: colors.red, borderColor: colors.red },
    text: { color: '#FFFFFF' },
    spinner: '#FFFFFF',
  },
  // Soft sage tint
  soft: {
    button: { backgroundColor: colors.sage, borderColor: colors.sageDeep },
    text: { color: colors.forestDark },
    spinner: colors.forestDark,
  },
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;

  return (
    <TouchableOpacity
      style={[styles.button, buttonSizes[size], v.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <Text maxFontSizeMultiplier={1.3} style={[styles.text, buttonTextSizes[size], v.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
  },

  disabled: {
    opacity: 0.55,
  },

  text: {
    textAlign: 'center',
  },
});
