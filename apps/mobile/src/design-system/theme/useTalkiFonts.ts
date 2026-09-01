import { useFonts } from 'expo-font';

import { fontAssets } from './fonts';

/** True once all eight bundled weights have loaded. The root layout must not
 *  render real content until this is true, or the very first frame renders
 *  in a system fallback face — the exact "silent fallback" phase-05-plan.md
 *  warns about. */
export function useTalkiFonts(): boolean {
  const [loaded] = useFonts(fontAssets);
  return loaded;
}
