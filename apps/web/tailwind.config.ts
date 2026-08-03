import { tailwindPreset } from '@mijersey/design-tokens';
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [tailwindPreset as Config],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta ligada al theme "Continuum" (apps/web/src/styles/theme-framework.css):
      // `arena` pasa a ser la escala neutra de tinta (--tf-neutral-*) y `pop`
      // el acento configurable (--tf-accent-*), para que todo el storefront
      // que ya usa estas utilidades de Tailwind se re-tematice sin tocar cada
      // archivo — el valor real vive en las variables CSS, no aquí.
      colors: {
        arena: {
          950: 'var(--tf-neutral-950, #0a0a0c)',
          900: 'var(--tf-neutral-900, #131317)',
          800: 'var(--tf-neutral-800, #212127)',
          700: 'var(--tf-neutral-700, #35353e)',
          600: 'var(--tf-neutral-600, #4d4d58)',
        },
        pop: {
          400: 'hsl(var(--tf-accent-h, 217) var(--tf-accent-s, 91%) calc(var(--tf-accent-l, 60%) + 8%))',
          500: 'var(--tf-accent, #3b82f6)',
          600: 'var(--tf-accent-strong, #2563eb)',
        },
      },
      fontFamily: {
        display: ['var(--tf-font-sans)', 'var(--font-display)'],
      },
      backgroundImage: {
        'arena-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        stardust:
          'radial-gradient(60% 50% at 80% 0%, hsl(var(--tf-accent-h, 217) var(--tf-accent-s, 91%) var(--tf-accent-l, 60%) / 0.25) 0%, transparent 70%)',
      },
    },
  },
};

export default config;
