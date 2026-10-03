import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { Brush, Dots, Paw, Bone } from './Doodles';

// Cream page with a sage brush stroke, green leaf dots and outline doodles.
//
// - `header`: a <ScreenHeader /> dark band shown at the top.
// - `scroll`: wraps the page in a ScrollView so the header band scrolls away with the content.
//   `contentStyle` styles the column under the header, `refreshControl` enables pull-to-refresh.
// - `style` applies to the body area (used to centre short, non-scrolling screens).
export default function ScreenBackground({
  header,
  scroll = false,
  contentStyle,
  refreshControl,
  style,
  children,
}) {
  return (
    <View style={styles.root}>
      {!scroll && header}
      <View style={[styles.body, style]}>
        {header ? (
          <Brush style={styles.brushBottomLeft} />
        ) : (
          <>
            <Brush style={styles.brushTopLeft} />
            <Dots color={colors.forest} style={styles.dotsTopRight} />
            <Paw size={58} color={colors.doodleLight} style={styles.pawBottomLeft} />
            <Bone length={96} color={colors.doodleLight} bg={colors.cream} style={styles.boneRight} />
          </>
        )}

        {scroll ? (
          <ScrollView style={styles.scroll} refreshControl={refreshControl}>
            {header}
            <View style={contentStyle}>{children}</View>
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  body: {
    flex: 1,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  brushBottomLeft: {
    position: 'absolute',
    left: -190,
    bottom: -170,
  },
  brushTopLeft: {
    position: 'absolute',
    left: -150,
    top: -140,
  },
  dotsTopRight: {
    position: 'absolute',
    top: 60,
    right: 10,
  },
  pawBottomLeft: {
    position: 'absolute',
    left: 26,
    bottom: 44,
  },
  boneRight: {
    position: 'absolute',
    right: 18,
    bottom: 150,
    transform: [{ rotate: '-28deg' }],
  },
});
