/**
 * A minimal in-memory stand-in for the pieces of expo-file-system and
 * expo-crypto that services/recordings/recordingStore.ts uses. Both real
 * modules pull in `react-native` internally, which fails to parse under
 * vitest (Flow syntax, no Babel/Metro transform in the Vite pipeline) — so
 * any test that reaches recordingStore.ts must `vi.mock('expo-file-system',
 * ...)` and `vi.mock('expo-crypto', ...)` with something like this before
 * importing it. This does not prove real filesystem or SQLite behaviour;
 * that is native-only and out of Tier 1's reach by design.
 */

interface FakeFileRecord {
  base64: string;
}

export function createFakeFileSystem() {
  const files = new Map<string, FakeFileRecord>();

  function segmentOf(part: unknown): string {
    if (typeof part === 'string') {
      return part;
    }
    if (part && typeof part === 'object' && 'uri' in part && typeof (part as { uri: unknown }).uri === 'string') {
      return (part as { uri: string }).uri.replace(/^file:\/\/\//, '');
    }
    return '';
  }

  function buildUri(parts: unknown[]): string {
    if (parts.length === 1 && typeof parts[0] === 'string' && (parts[0] as string).startsWith('file://')) {
      return parts[0] as string;
    }
    const segments = parts.map(segmentOf).filter(Boolean);
    return `file:///${segments.join('/').replace(/\/{2,}/g, '/')}`;
  }

  class FakeDirectory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = buildUri(parts);
    }
    get exists(): boolean {
      return true;
    }
    create(): void {
      // Directories aren't separately materialized in this fake.
    }
  }

  class FakeFile {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = buildUri(parts);
    }
    get exists(): boolean {
      return files.has(this.uri);
    }
    create(_options?: { overwrite?: boolean; intermediates?: boolean }): void {
      if (!files.has(this.uri)) {
        files.set(this.uri, { base64: '' });
      }
    }
    write(content: string, _options?: { encoding?: string }): void {
      files.set(this.uri, { base64: content });
    }
    async base64(): Promise<string> {
      const record = files.get(this.uri);
      if (!record) {
        throw new Error(`fake file system: no such file ${this.uri}`);
      }
      return record.base64;
    }
    delete(): void {
      files.delete(this.uri);
    }
  }

  const Paths = { document: new FakeDirectory('document') };

  return {
    File: FakeFile,
    Directory: FakeDirectory,
    Paths,
    /** Direct access for assertions — e.g. "exactly one file was written". */
    __files: files,
  };
}

/** A deterministic, non-cryptographic stand-in for expo-crypto's
 *  digestStringAsync — different inputs must still hash to different
 *  outputs (recordings.test.ts relies on that to prove distinct keys don't
 *  collide onto the same filename), but it does not need to be SHA-256. */
export function createFakeCrypto() {
  return {
    async digestStringAsync(_algorithm: unknown, data: string): Promise<string> {
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = (hash * 31 + data.charCodeAt(i)) >>> 0;
      }
      return hash.toString(16).padStart(8, '0');
    },
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    CryptoEncoding: { HEX: 'hex', BASE64: 'base64' },
  };
}
