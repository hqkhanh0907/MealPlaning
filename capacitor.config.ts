import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthmate.ai',
  appName: 'HealthMate AI',
  webDir: 'www',
  android: {
    buildOptions: {
      signingType: 'apksigner',
    },
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
    },
    SplashScreen: {
      launchAutoHide: false,
      androidSplashResourceName: 'splash',
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#4CAF50',
    },
  },
};

export default config;
