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
  /* 'default' (not 'portrait'): Phase 4 replaces the legacy app-wide
     portrait lock (index.html 4088-4090, and this same field previously)
     with OrientationService's per-route policy — games and practice are
     landscape (deliberate deviation, feature-parity-checklist.md §14). A
     static 'portrait' here would bake a portrait-only restriction into the
     native manifest/Info.plist that expo-screen-orientation's runtime
     lockAsync(LANDSCAPE) would then have to fight rather than simply set. */
  orientation: 'default',
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
  plugins: [
    'expo-router',
    'expo-image',
    'expo-sqlite',
    'expo-font',
    [
      'expo-audio',
      {
        microphonePermission:
          'Allow Talki to use the microphone to record a parent’s voice and to play speech-recognition games.',
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'Allow Talki to use the microphone to record a parent’s voice and to play speech-recognition games.',
        speechRecognitionPermission: 'Allow Talki to use speech recognition for the "Say it!" game.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
