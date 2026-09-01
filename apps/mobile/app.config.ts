import type { ExpoConfig } from 'expo/config';

/* Production id matches capacitor.config.ts so the two builds can never be
   installed side by side under different identities during cutover. The dev
   client uses a distinct id so it can be installed next to a release build. */
const IS_DEV = process.env.APP_VARIANT === 'development';

const PRODUCTION_APP_ID = 'com.yonicks.talki';
const DEVELOPMENT_APP_ID = 'com.yonicks.talki.dev';

const config: ExpoConfig = {
  name: IS_DEV ? 'Talki (Dev)' : 'Talki',
  slug: 'talki',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'talki',
  ios: {
    bundleIdentifier: IS_DEV ? DEVELOPMENT_APP_ID : PRODUCTION_APP_ID,
    supportsTablet: true,
  },
  android: {
    package: IS_DEV ? DEVELOPMENT_APP_ID : PRODUCTION_APP_ID,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: ['expo-router', 'expo-image'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
