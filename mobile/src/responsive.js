import { Dimensions } from 'react-native';

// Sizes in the app are designed on a 390px-wide phone. `rs()` adapts them to the real screen width:
// big headings and photos scale fully, small body text only a little so it stays readable.
// Widths of 600px and up (tablets, desktop browsers) keep the designed sizes.
const BASE_WIDTH = 390;
const { width } = Dimensions.get('window');

export const screenWidth = width;
export const isSmallPhone = width < 350;

const factor = width >= 600 ? 1 : Math.min(Math.max(width / BASE_WIDTH, 0.82), 1.1);

export function rs(size) {
  const scaled = size <= 16 ? size * (1 + (factor - 1) * 0.4) : size * factor;
  return Math.round(scaled);
}
