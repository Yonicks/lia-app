/**
 * Photo capture for custom words. Phase 12 does not add expo-image-picker
 * in this sandbox (expo-doctor / no native device). Production native can
 * later implement pick() via image-picker, resized to 320x320 JPEG.
 * Tests and web inject a data URL through `window.__talkiCustomPhoto`.
 */
export interface PhotoService {
  pick(): Promise<string | null>;
}

export const photoService: PhotoService = {
  async pick() {
    if (typeof window !== 'undefined') {
      const stub = (window as unknown as { __talkiCustomPhoto?: string }).__talkiCustomPhoto;
      if (typeof stub === 'string') return stub;
    }
    return null;
  },
};
