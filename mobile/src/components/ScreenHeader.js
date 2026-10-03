import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Heading from './Heading';
import { Bone, Paw } from './Doodles';
import { colors, fonts } from '../theme';
import { rs } from '../responsive';

// Dark-green header band with outline doodles, a gold eyebrow and a white serif title.
// `left` / `right` hold nav buttons, `children` render under the subtitle.
export default function ScreenHeader({ eyebrow, title, subtitle, left, right, size = 'md', children }) {
  // Keep content clear of the notch / status bar on every phone
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.band, { paddingTop: Math.max(insets.top + 12, 36) }]}>
      {/* Light status-bar icons so the clock and battery show on the dark band */}
      <StatusBar style="light" />
      <Bone length={104} color={colors.doodleDark} bg={colors.deep} style={styles.bone} />
      <Paw size={48} color={colors.doodleDark} style={styles.paw} />

      <View style={styles.inner}>
        {left || right ? (
          <View style={styles.actions}>
            {/* Never wraps onto a second line: the left side shrinks (and scrolls) to make room */}
            <View style={styles.actionLeft}>{left}</View>
            {right ? <View style={styles.actionRight}>{right}</View> : null}
          </View>
        ) : null}

        {title ? (
          <Heading tone="light" size={size} eyebrow={eyebrow}>
            {title}
          </Heading>
        ) : null}

        {subtitle ? <Text maxFontSizeMultiplier={1.3} style={styles.subtitle}>{subtitle}</Text> : null}

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.deep,
    paddingBottom: 26,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  // The doodles sit low, beside the title, so they never run behind the navigation row
  bone: {
    position: 'absolute',
    bottom: 58,
    right: -46,
    transform: [{ rotate: '28deg' }],
  },
  paw: {
    position: 'absolute',
    bottom: 12,
    right: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 600, // matches the 640px body column minus its 20px padding
    alignSelf: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  actionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRight: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: fonts.script,
    fontSize: rs(22),
    lineHeight: rs(27),
    color: '#D3E2D9',
    marginTop: 6,
  },
});
