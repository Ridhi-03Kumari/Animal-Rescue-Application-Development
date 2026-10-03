import { Platform } from 'react-native';
import { rs } from './responsive';

// Atria-inspired palette: cream pages, deep forest green bands, lime / orange accents.
export const colors = {
  cream: '#F6F0E9', // page background
  deep: '#082C27', // dark header bands and dark sections
  forest: '#0E4B43', // primary buttons, key text
  forestDark: '#0A3430', // headings on cream
  sage: '#DDE5CF', // soft tint for badges / selected states
  sageDeep: '#BEC4AB', // secondary button fill
  brush: '#D2D8C0', // soft brush shapes in the page background
  lime: '#A6E46A', // bright call-to-action on dark areas
  orange: '#F5A524', // accent buttons
  orangeSoft: '#FCE9C6', // soft accent tint
  coral: '#F0736A', // accent underline
  red: '#D94B42', // decline / destructive buttons
  gold: '#B8862A', // eyebrow text on cream
  goldLight: '#E2B04A', // eyebrow text on dark
  ink: '#10302B', // strong text
  muted: '#566058', // body text
  soft: '#7D857F', // captions, placeholders
  border: '#E3D8CB', // card and input borders
  divider: '#EDE4D8', // thin separators
  doodleDark: 'rgba(166, 228, 106, 0.42)', // outline doodles on dark bands
  doodleLight: 'rgba(14, 75, 67, 0.30)', // outline doodles on cream
};

export const fonts = {
  // Everyday serif for small labels
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, "Times New Roman", serif',
  }),
  // Tall small-caps for headings and buttons (loaded in App.js)
  display: 'CormorantSC_700Bold',
  // Handwritten pen for subtitles and taglines (loaded in App.js)
  script: 'Caveat_600SemiBold',
};

// Shared type scale so text sizes stay consistent from screen to screen.
export const type = {
  display: { fontSize: 34, lineHeight: 40 },
  h1: { fontSize: 28, lineHeight: 34 },
  h2: { fontSize: 22, lineHeight: 28 },
  h3: { fontSize: 19, lineHeight: 25 },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 13, lineHeight: 18 },
};

// Shared button sizing so every tappable control in the app feels the same.
// Heights stay at or above ~42dp so they are comfortable to tap.
const centered = { alignItems: 'center', justifyContent: 'center' };

export const buttonSizes = {
  // Primary call-to-action (submit, accept, complete)
  lg: { ...centered, minHeight: 56, paddingHorizontal: 24, borderRadius: 14 },
  // Standard button (secondary actions, call, share)
  md: { ...centered, minHeight: 50, paddingHorizontal: 20, borderRadius: 12 },
  // Compact button inside a row or card
  sm: { ...centered, minHeight: 44, paddingHorizontal: 16, borderRadius: 12 },
  // Chips, nav links, back / refresh controls
  pill: { ...centered, minHeight: 44, paddingHorizontal: 18, borderRadius: 22 },
};

export const buttonTextSizes = {
  lg: { fontSize: rs(20), letterSpacing: 0.4, fontFamily: fonts.display },
  md: { fontSize: rs(19), letterSpacing: 0.4, fontFamily: fonts.display },
  sm: { fontSize: rs(15), fontWeight: '700' },
  pill: { fontSize: rs(14), fontWeight: '700' },
};
