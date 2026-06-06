import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mathapp.app',
  appName: 'MathApp',
  webDir: 'out',
  server: {
    url: 'https://mathapp-eight.vercel.app',
    cleartext: false,
  },
};

export default config;