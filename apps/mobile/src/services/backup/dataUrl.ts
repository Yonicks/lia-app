/**
 * Pure `data:` URL <-> {mime, base64} conversion. No filesystem access here
 * — services/recordings/recordingStore.ts is the only caller, and it is the
 * boundary where a data URL string becomes a file on disk (or vice versa).
 * Kept pure and dependency-free so it is trivial to test directly.
 */
export interface ParsedDataUrl {
  mime: string;
  base64: string;
}

const DATA_URL_RE = /^data:([^;,]*)(;charset=[^;,]+)?(;base64)?,(.*)$/s;

export function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) {
    throw new Error('not a data URL');
  }
  const [, mimeRaw, , base64Flag, payload] = match;
  if (!base64Flag) {
    throw new Error('only base64-encoded data URLs are supported');
  }
  return {
    mime: mimeRaw || 'application/octet-stream',
    base64: payload,
  };
}

export function buildDataUrl(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}
