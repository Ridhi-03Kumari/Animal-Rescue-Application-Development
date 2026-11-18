import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, fonts } from '../theme';
import { rs } from '../responsive';

const SIZES = {
  lg: { fontSize: rs(46), lineHeight: rs(50) },
  md: { fontSize: rs(38), lineHeight: rs(42) },
  sm: { fontSize: rs(30), lineHeight: rs(34) },
};

// Highlighted word inside a heading: italic with a coral underline.
export function Accent({ children }) {
  return <Text maxFontSizeMultiplier={1.3} style={styles.accent}>{children}</Text>;
}

// Serif heading with an optional small gold eyebrow line above it.
// tone="light" is for dark bands and photos (white text).
// Usage: <Heading eyebrow="Hello">How can we <Accent>help</Accent> today?</Heading>
export default function Heading({ children, eyebrow, align = 'left', size = 'md', tone = 'dark', style }) {
  const centered = align === 'center';
  const light = tone === 'light';

  return (
    <View style={[centered ? styles.centered : styles.left, style]}>
      {eyebrow ? (
        <Text maxFontSizeMultiplier={1.3} style={[styles.eyebrow, light && styles.eyebrowLight, centered && styles.textCenter]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text maxFontSizeMultiplier={1.3} style={[styles.title, SIZES[size], light && styles.titleLight, centered && styles.textCenter]}>
        {children}
      </Text>
    </View>
  );
}

// The title and eyebrow take the full width of their column (instead of shrinking to fit the text) and are
// aligned with `textAlign`. On Android a shrink-wrapped title can wrap its last word onto a hidden second
// line, so the last word (like "Pet" in "Adopt a Pet") disappeared.
const styles = StyleSheet.create({
  left: {
    alignItems: 'stretch',
  },
  centered: {
    alignItems: 'stretch',
  },
  textCenter: {
    textAlign: 'center',
  },
  eyebrow: {
    fontFamily: fonts.display,
    fontSize: rs(16),
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 6,
  },
  eyebrowLight: {
    color: colors.goldLight,
  },
  title: {
    fontFamily: fonts.display,
    letterSpacing: 0.3,
    color: colors.forestDark,
  },
  titleLight: {
    color: '#FFFFFF',
  },
  accent: {
    // The heading font has no italic. Android swaps in a different system font to fake one, which looks
    // off-brand and can break the line, so Android keeps the heading font and relies on the underline.
    fontStyle: Platform.OS === 'android' ? 'normal' : 'italic',
    textDecorationLine: 'underline',
    textDecorationColor: colors.coral,
  },
});
