import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

// Simple outline illustrations (paw, bone) and brush shapes drawn with plain Views,
// so no SVG library is needed. Colors are passed in as solid / rgba values.

export function Paw({ size = 56, color, style }) {
  const s = size;
  const w = Math.max(1.5, s / 28);
  const toe = {
    position: 'absolute',
    width: s * 0.2,
    height: s * 0.27,
    borderRadius: s * 0.13,
    borderWidth: w,
    borderColor: color,
  };

  return (
    <View style={[{ width: s, height: s }, style]}>
      <View style={[toe, { left: 0, top: s * 0.34, transform: [{ rotate: '-24deg' }] }]} />
      <View style={[toe, { left: s * 0.24, top: s * 0.1, transform: [{ rotate: '-8deg' }] }]} />
      <View style={[toe, { left: s * 0.56, top: s * 0.1, transform: [{ rotate: '8deg' }] }]} />
      <View style={[toe, { left: s * 0.8, top: s * 0.34, transform: [{ rotate: '24deg' }] }]} />
      <View
        style={{
          position: 'absolute',
          left: s * 0.2,
          top: s * 0.46,
          width: s * 0.6,
          height: s * 0.48,
          borderRadius: s * 0.26,
          borderWidth: w,
          borderColor: color,
        }}
      />
    </View>
  );
}

// `bg` must match the color behind the bone: the knobs are filled with it to hide the shaft ends.
export function Bone({ length = 84, color, bg, style }) {
  const d = length * 0.22;
  const h = d * 0.7;
  const w = Math.max(1.5, length / 40);
  const knob = {
    position: 'absolute',
    width: d,
    height: d,
    borderRadius: d / 2,
    borderWidth: w,
    borderColor: color,
    backgroundColor: bg,
  };

  return (
    <View style={[{ width: length, height: d * 2 }, style]}>
      <View
        style={{
          position: 'absolute',
          left: d * 0.5,
          right: d * 0.5,
          top: d - h / 2,
          height: h,
          borderTopWidth: w,
          borderBottomWidth: w,
          borderColor: color,
        }}
      />
      <View style={[knob, { left: 0, top: 0 }]} />
      <View style={[knob, { left: 0, top: d }]} />
      <View style={[knob, { left: length - d, top: 0 }]} />
      <View style={[knob, { left: length - d, top: d }]} />
    </View>
  );
}

const DOTS = [
  { left: 0, top: 30, width: 26, height: 14, rotate: '-30deg' },
  { left: 30, top: 8, width: 20, height: 11, rotate: '-10deg' },
  { left: 50, top: 36, width: 30, height: 15, rotate: '-35deg' },
  { left: 16, top: 58, width: 22, height: 12, rotate: '-20deg' },
  { left: 62, top: 6, width: 16, height: 9, rotate: '15deg' },
];

// Cluster of small leaf-shaped dots
export function Dots({ color = colors.forest, style }) {
  return (
    <View style={[{ width: 84, height: 76 }, style]}>
      {DOTS.map((d, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: d.left,
            top: d.top,
            width: d.width,
            height: d.height,
            borderRadius: d.height / 2,
            backgroundColor: color,
            transform: [{ rotate: d.rotate }],
          }}
        />
      ))}
    </View>
  );
}

// Organic brush-stroke blob made from a few overlapping shapes
export function Brush({ color = colors.brush, style }) {
  return (
    <View style={[{ width: 320, height: 280 }, style]}>
      <View style={{ position: 'absolute', left: 0, top: 0, width: 210, height: 210, borderRadius: 105, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: 110, top: 80, width: 190, height: 100, borderRadius: 50, backgroundColor: color, transform: [{ rotate: '20deg' }] }} />
      <View style={{ position: 'absolute', left: 20, top: 170, width: 150, height: 90, borderRadius: 45, backgroundColor: color, transform: [{ rotate: '-18deg' }] }} />
      <View style={{ position: 'absolute', left: 150, top: -10, width: 120, height: 70, borderRadius: 35, backgroundColor: color, transform: [{ rotate: '15deg' }] }} />
    </View>
  );
}
