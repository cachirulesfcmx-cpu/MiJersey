import { tailwindPreset } from '@mijersey/design-tokens';
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [tailwindPreset as Config],
  content: ['./src/**/*.{ts,tsx}'],
};

export default config;
