import { useCallback, useEffect, useRef, useState } from 'react';
import { Stack, useGlobalSearchParams, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdBanner } from '../src/components/shell/AdBanner';

import { forceRTL } from '../src/design-system/rtl/forceRTL';
import { v3 } from '../src/design-system/theme/colors';
import { useTalkiFonts } from '../src/design-system/theme/useTalkiFonts';
import { gameHref, parseGameDeepLink } from '../src/domain/navigation/routes';
import { IntroSequence } from '../src/features/intro/IntroSequence';
import { StudioBumper } from '../src/features/intro/studioBumper';
import { useTalkiKeepAwake } from '../src/services/keepAwake';
import { installE2ERouterBridge } from '../src/testing/e2eRouterBridge';
import { installE2EStorageBridge } from '../src/testing/e2eStorageBridge';
import { installE2EStoreBridge } from '../src/testing/e2eStoreBridge';
import { installE2EVoiceSpyBridge } from '../src/testing/e2eVoiceSpyBridge';
import { testIds } from '../src/testing/testIds';

installE2EStorageBridge();
installE2EVoiceSpyBridge();
installE2ERouterBridge();
installE2EStoreBridge();
forceRTL();

const SPLASH_MS = 1400;
const splashStartedAt = Date.now();
try {
  void SplashScreen.preventAutoHideAsync();
} catch {
  /* web / already prevented */
}

let introPlayedThisSession = false;

type OpeningStage = 'bumper' | 'intro' | 'app';

function hideNativeSplash(): void {
  const wait = Math.max(0, SPLASH_MS - (Date.now() - splashStartedAt));
  setTimeout(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, wait);
}

function DeepLinkAfterIntro() {
  const router = useRouter();
  const params = useGlobalSearchParams() as Record<string, string | string[] | undefined>;
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const id = parseGameDeepLink(params);
    if (!id) return;
    done.current = true;
    router.push(gameHref(id));
  }, [params, router]);
  return null;
}

export default function RootLayout() {
  useTalkiKeepAwake();
  const fontsLoaded = useTalkiFonts();
  const params = useGlobalSearchParams() as { intro?: string };
  const introDisabled = params.intro === '0';
  const [stage, setStage] = useState<OpeningStage>(
    introDisabled || introPlayedThisSession ? 'app' : 'bumper',
  );

  const advance = useCallback(() => {
    introPlayedThisSession = true;
    setStage((prev) => (prev === 'bumper' ? 'intro' : 'app'));
  }, []);

  useEffect(() => {
    if (fontsLoaded) hideNativeSplash();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: v3.bg }}>
        <ActivityIndicator color={v3.purple600} />
      </View>
    );
  }

  if (stage === 'bumper') {
    return <StudioBumper onComplete={advance} />;
  }
  if (stage === 'intro') {
    return <IntroSequence testID={testIds.intro.root} onComplete={advance} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
            <DeepLinkAfterIntro />
          </View>
          <AdBanner />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
