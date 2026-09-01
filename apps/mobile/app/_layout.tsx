import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { forceRTL } from '../src/design-system/rtl/forceRTL';
import { v3 } from '../src/design-system/theme/colors';
import { useTalkiFonts } from '../src/design-system/theme/useTalkiFonts';
import { installE2ERouterBridge } from '../src/testing/e2eRouterBridge';
import { installE2EStorageBridge } from '../src/testing/e2eStorageBridge';
import { installE2EVoiceSpyBridge } from '../src/testing/e2eVoiceSpyBridge';

// Module-level, not inside the component: runs once per bundle load,
// web-only, no-op on native. See e2eStorageBridge.ts /
// e2eVoiceSpyBridge.ts / e2eRouterBridge.ts for why these exist.
installE2EStorageBridge();
installE2EVoiceSpyBridge();
installE2ERouterBridge();
forceRTL();

export default function RootLayout() {
  const fontsLoaded = useTalkiFonts();

  if (!fontsLoaded) {
    // A blank/system-font first frame is the exact "silent fallback" the
    // font-bundling requirement guards against — block on load instead.
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: v3.bg }}>
        <ActivityIndicator color={v3.purple600} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
