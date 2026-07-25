import type { Config } from 'tailwindcss';
import { colors, radius, shadow, spacing, typography } from './tokens.js';

export const tailwindPreset: Partial<Config> = {
  theme: {
    extend: {
      colors,
      spacing,
      borderRadius: radius,
      fontFamily: {
        sans: [...typography.fontFamily.sans],
      },
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      boxShadow: shadow,
    },
  },
};
