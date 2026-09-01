import { Stack } from 'expo-router';

import { installE2ERouterBridge } from '../src/testing/e2eRouterBridge';
import { installE2EStorageBridge } from '../src/testing/e2eStorageBridge';
import { installE2EVoiceSpyBridge } from '../src/testing/e2eVoiceSpyBridge';

// Module-level, not inside the component: runs once per bundle load,
// web-only, no-op on native. See e2eStorageBridge.ts /
// e2eVoiceSpyBridge.ts / e2eRouterBridge.ts for why these exist.
installE2EStorageBridge();
installE2EVoiceSpyBridge();
installE2ERouterBridge();

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
