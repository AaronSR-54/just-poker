import type { CapacitorConfig } from '@capacitor/cli';

const background = '#22201f';

const config: CapacitorConfig = {
  appId: 'com.justpoker.app',
  appName: 'Just Poker',
  webDir: 'dist',
  backgroundColor: background,
  android: {
    backgroundColor: background,
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 600,
      backgroundColor: background,
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
    SystemBars: {
      style: 'DARK',
    },
  },
};

export default config;
