import type { Config } from 'tailwindcss';
import { tailwindPreset } from '@mijersey/design-tokens';

const config: Config = {
  presets: [tailwindPreset as Config],
  content: ['./src/**/*.{ts,tsx}'],
};

export default config;
