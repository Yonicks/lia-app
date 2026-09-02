import { createManagedTimers } from '../shell/managedTimers';

export const BUBBLE_STAGGER_MS = 700;
export const BUBBLE_INTERVAL_MS = 1400;
export const BUBBLE_INITIAL = 3;

/**
 * Interval + staggered first burst. Pause on background, resume on
 * foreground, always clear on unmount (phase-10 plan).
 */
export function createBubbleSpawner(spawn: () => void) {
  const timers = createManagedTimers();
  let running = false;
  let intervalArmed = false;

  const armInterval = () => {
    intervalArmed = true;
    const tick = () => {
      if (!running || !intervalArmed) return;
      spawn();
      timers.schedule(BUBBLE_INTERVAL_MS, tick);
    };
    timers.schedule(BUBBLE_INTERVAL_MS, tick);
  };

  return {
    start() {
      this.stop();
      running = true;
      for (let i = 0; i < BUBBLE_INITIAL; i++) {
        timers.schedule(i * BUBBLE_STAGGER_MS, () => {
          if (running) spawn();
        });
      }
      armInterval();
    },
    pause() {
      intervalArmed = false;
      timers.cancelAll();
    },
    resume() {
      if (!running) return;
      armInterval();
    },
    stop() {
      running = false;
      intervalArmed = false;
      timers.cancelAll();
    },
    pending() {
      return timers.pending();
    },
  };
}
