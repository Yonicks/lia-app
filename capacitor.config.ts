import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yonicks.talki',
  appName: 'Talki',
  webDir: 'www',
  backgroundColor: '#FFF6E4',
  android: {
    allowMixedContent: false,
    backgroundColor: '#FFF6E4'
  },
  ios: {
    backgroundColor: '#FFF6E4',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Talki'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1400,
      launchAutoHide: true,
      backgroundColor: '#FFF6E4',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFF6E4'
    }
  }
};

export default config;
