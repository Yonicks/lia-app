import { I18nManager } from 'react-native';

/**
 * Talki is Hebrew-only and never runs LTR (legacy: `<html lang="he"
 * dir="rtl">`, unconditionally). On native, `I18nManager.forceRTL()` only
 * takes effect after the next reload — calling it here, at module-evaluation
 * time (before any component renders), matches the standard Expo/RN
 * pattern of setting it once at app startup. On web `I18nManager` is a
 * react-native-web stub with no effect (see rtl/logical.ts); web RTL comes
 * entirely from `TalkiScreen`'s `writingDirection: 'rtl'` style, so this
 * call is a harmless no-op there rather than the actual mechanism.
 */
export function forceRTL(): void {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }
}
