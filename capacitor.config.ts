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
      // Story 2.2 Option B: dùng ic_launcher_round có sẵn (đã verify trong res/mipmap*).
      // ic_notification asset proper (white silhouette transparent) sẽ tạo ở Story 2.5
      // release prep cùng design system. Không để config trỏ asset không tồn tại
      // — gây notification fail render khi schedule.
      smallIcon: 'ic_launcher_round',
      iconColor: '#4CAF50',
    },
  },
};

export default config;
