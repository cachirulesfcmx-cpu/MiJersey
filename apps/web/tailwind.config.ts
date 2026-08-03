import { tailwindPreset } from '@mijersey/design-tokens';
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [tailwindPreset as Config],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta "arena" — solo para el storefront (apps/web), no toca el preset
      // compartido con apps/admin. Violeta oscuro a magenta, tono energético
      // inspirado en estética "glitch/arcade" genérica (sin depender de
      // ningún sitio o marca puntual): fondo profundo para header/footer/hero,
      // acento vibrante para CTAs y badges.
      colors: {
        arena: {
          950: '#0b0a1f',
          900: '#140f33',
          800: '#231352',
          700: '#361b72',
          600: '#4a1f8f',
        },
        pop: {
          400: '#ff5fb0',
          500: '#e8348f',
          600: '#c21f75',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
      },
      backgroundImage: {
        'arena-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        stardust:
          'radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.5) 0, transparent 60%), radial-gradient(1.5px 1.5px at 70% 60%, rgba(255,255,255,0.4) 0, transparent 60%), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.35) 0, transparent 60%), radial-gradient(1px 1px at 90% 20%, rgba(255,255,255,0.3) 0, transparent 60%), radial-gradient(1.5px 1.5px at 55% 10%, rgba(255,255,255,0.4) 0, transparent 60%)',
      },
    },
  },
};

export default config;
