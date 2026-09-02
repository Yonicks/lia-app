export interface PhotoService {
  /** Returns a 320×320 JPEG data URL, or null if cancelled / denied. */
  pick(): Promise<string | null>;
}
