import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { rs, screenWidth } from '../responsive';

// On typical phone widths keep the row compact so every item fits on one line
const COMPACT = screenWidth < 400;

// A clean single row of plain-text items with no background. The current item is brighter and
// underlined; a lone item (Back, Refresh) is a simple outlined pill.
//
// - tone="light": for the dark header band (white text, lime underline)
// - tone="dark":  for cream pages (green text, green underline)
// - items: [{ key, label, onPress, dot? }]  (`dot` is an optional status colour shown before the label)
// Always one line: if the items are wider than the screen the row scrolls sideways instead of wrapping.
export default function SegmentedNav({ items, activeKey, tone = 'light', style }) {
  const solo = items.length === 1;
  const dark = tone === 'dark';

  const row = items.map((item) => {
    const active = !solo && item.key === activeKey;

    return (
      <Pressable
        key={item.key}
        onPress={item.onPress}
        accessibilityRole="button"
        hitSlop={{ top: 4, bottom: 4 }}
        style={({ pressed, hovered }) => [
          solo ? styles.soloItem : styles.item,
          solo && !dark && styles.soloItemLight,
          !solo && active && (dark ? styles.itemActiveDark : styles.itemActiveLight),
          (pressed || hovered) && styles.itemPressed,
        ]}
      >
        {item.dot ? <View style={[styles.dot, { backgroundColor: item.dot }]} /> : null}
        <Text
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={[
            styles.label,
            dark ? styles.labelDark : styles.labelLight,
            (active || solo) && (dark ? styles.labelActiveDark : styles.labelActiveLight),
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  });

  if (solo) {
    return <View style={[styles.soloWrap, style]}>{row}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={styles.row}
    >
      {row}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    maxWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: COMPACT ? 12 : 18,
  },
  soloWrap: {
    alignSelf: 'flex-start',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  itemActiveLight: {
    borderBottomColor: colors.lime,
  },
  itemActiveDark: {
    borderBottomColor: colors.forest,
  },
  itemPressed: {
    opacity: 0.7,
  },
  soloItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.sageDeep,
  },
  soloItemLight: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  label: {
    fontSize: COMPACT ? 13 : rs(14),
    fontWeight: '600',
  },
  labelLight: {
    color: '#C9D9CF',
  },
  labelDark: {
    color: colors.muted,
  },
  labelActiveLight: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  labelActiveDark: {
    color: colors.forestDark,
    fontWeight: '800',
  },
});
