export const colors = {
  brand: {
    50: '#f5f7ff',
    100: '#e6eaff',
    200: '#c3ccff',
    300: '#9aa8ff',
    400: '#6b7cff',
    500: '#4054f4',
    600: '#2f3fd1',
    700: '#2531a6',
    800: '#1f2985',
    900: '#1c2570',
  },
  neutral: {
    0: '#ffffff',
    50: '#f7f7f8',
    100: '#eeeeef',
    200: '#d8d8db',
    300: '#b7b8bd',
    400: '#8f9096',
    500: '#6b6c72',
    600: '#505157',
    700: '#3b3c40',
    800: '#232427',
    900: '#151517',
    1000: '#000000',
  },
  success: { 50: '#eafbf1', 500: '#1f9d55', 600: '#187a42' },
  warning: { 50: '#fdf6e8', 500: '#d69e2e', 600: '#b7791f' },
  danger: { 50: '#fdecee', 500: '#e12d39', 600: '#cf1124' },
} as const;

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export const radius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const shadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const;
