import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mathapp.app',
  appName: 'MathApp',
  webDir: 'out',
  server: {
    url: 'https://tu-app.vercel.app',
    cleartext: true,
  },
};

export default config;