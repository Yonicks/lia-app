import type { AdService } from './AdService';

/** Web and any environment where AdMob must not run (index.html 4092-4093). */
export const noopAds: AdService = {
  async start() {
    /* no ad element, no reserved height */
  },
  async stop() {
    /* */
  },
  isAvailable() {
    return false;
  },
};
