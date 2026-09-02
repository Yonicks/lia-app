import type { PhotoService } from './types';

function e2eStub(): string | null {
  if (typeof window === 'undefined') return null;
  const stub = (window as unknown as { __talkiCustomPhoto?: string }).__talkiCustomPhoto;
  return typeof stub === 'string' ? stub : null;
}

export const photoService: PhotoService = {
  async pick() {
    return e2eStub();
  },
};

export type { PhotoService } from './types';
