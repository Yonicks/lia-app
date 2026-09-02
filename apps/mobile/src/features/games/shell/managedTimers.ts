/**
 * Session-owned timers. `missing` (2600 ms show→ask) and `memory`
 * (900 ms mismatch close) must cancel on unmount so a dead screen never
 * fires. Injected clocks keep the helper unit-testable.
 */
export type TimerId = ReturnType<typeof setTimeout>;

export interface ManagedTimers {
  schedule: (ms: number, fn: () => void) => TimerId;
  cancel: (id: TimerId) => void;
  cancelAll: () => void;
  pending: () => number;
}

export function createManagedTimers(
  setT: typeof setTimeout = setTimeout,
  clearT: typeof clearTimeout = clearTimeout,
): ManagedTimers {
  const ids = new Set<TimerId>();
  return {
    schedule(ms, fn) {
      const id = setT(() => {
        ids.delete(id);
        fn();
      }, ms);
      ids.add(id);
      return id;
    },
    cancel(id) {
      clearT(id);
      ids.delete(id);
    },
    cancelAll() {
      for (const id of ids) clearT(id);
      ids.clear();
    },
    pending() {
      return ids.size;
    },
  };
}
