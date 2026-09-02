export interface AdService {
  /** Web / unavailable: no-op. Native: initialise + show banner. */
  start(onHeight: (px: number) => void): Promise<void>;
  stop(): Promise<void>;
  isAvailable(): boolean;
}

export type { AdService as default };
