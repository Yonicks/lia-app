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
  /* 'landscape' (not 'default' or 'portrait'): Phase 4 replaced the legacy
     app-wide portrait lock (index.html 4088-4090, and this same field
     previously) with a per-route runtime policy — only games and practice
     were landscape. Phase 17 (docs/migration/phase-17-report.md) replaced
     that per-route policy with a single app-wide contract: the whole
     product, child and parent, is landscape-only now (AGENTS.md
     "LANDSCAPE REDESIGN NON-NEGOTIABLES" #1). Baking that into the native
     manifest/Info.plist here means the OS itself never offers a portrait
     frame; `orientationService.lockLandscape()` (called once at boot,
     app/_layout.tsx) is the runtime belt to this manifest-level suspenders
     — it is also the only mechanism that has any effect on Expo web, which
     does not read this field. */
  orientation: 'landscape',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'talki',
  ios: {
    bundleIdentifier: IS_DEV ? DEVELOPMENT_APP_ID : PRODUCTION_APP_ID,
    supportsTablet: true,
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Talki uses the microphone so a parent can record their own voice for words, and for speech practice. / Talki משתמשת במיקרופון כדי שההורה יוכל להקליט את קולו למילים ולתרגול דיבור.',
      NSCameraUsageDescription:
        'Talki uses the camera only when a parent adds a photo for a custom word. / Talki משתמשת במצלמה רק כשההורה מוסיף תמונה למילה אישית.',
      NSPhotoLibraryUsageDescription:
        'Talki uses the photo library only when a parent picks a picture for a custom word. / Talki משתמשת בספריית התמונות רק כשההורה בוחר תמונה למילה אישית.',
    },
  },
  android: {
    package: IS_DEV ? DEVELOPMENT_APP_ID : PRODUCTION_APP_ID,
    adaptiveIcon: {
      backgroundColor: '#FFF6E4',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['android.permission.RECORD_AUDIO', 'android.permission.CAMERA'],
  },
  androidStatusBar: {
    barStyle: 'dark-content',
    backgroundColor: '#FFF8EA',
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
      'expo-splash-screen',
      {
        backgroundColor: '#FFF6E4',
        image: './assets/icon.png',
        resizeMode: 'contain',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Talki uses the photo library only when a parent picks a picture for a custom word. / Talki משתמשת בספריית התמונות רק כשההורה בוחר תמונה למילה אישית.',
        cameraPermission:
          'Talki uses the camera only when a parent adds a photo for a custom word. / Talki משתמשת במצלמה רק כשההורה מוסיף תמונה למילה אישית.',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission:
          'Talki uses the microphone so a parent can record their own voice for words, and for speech practice. / Talki משתמשת במיקרופון כדי שההורה יוכל להקליט את קולו למילים ולתרגול דיבור.',
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'Talki uses the microphone so a parent can record their own voice for words, and for speech practice. / Talki משתמשת במיקרופון כדי שההורה יוכל להקליט את קולו למילים ולתרגול דיבור.',
        speechRecognitionPermission:
          'Talki uses speech recognition for the "Say it!" game. / Talki משתמשת בזיהוי דיבור למשחק "תגידי את זה".',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    splashBackground: '#FFF6E4',
    statusBarBackground: '#FFF8EA',
  },
};

export default config;
