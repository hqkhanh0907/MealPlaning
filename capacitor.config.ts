import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mealplaner.app',
  appName: 'Smart Meal Planner',
  webDir: 'dist',
  android: {
    backgroundColor: '#f8fafc',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
      },
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
  },
};

export default config;
