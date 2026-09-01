import { CATEGORIES } from '../../domain/vocabulary/categories';
import { key } from '../../domain/progress/keys';
import type { CategoryId } from '../../domain/types';
import type { VoicePorts } from './voicePorts';
import type { VoiceSource, WordVoiceService } from './WordVoiceService';

/**
 * The platform-independent half of `WordVoiceService`: the three-step
 * resolution order, the `opts.core` gate, and never-throw error handling.
 * All I/O goes through the injected `VoicePorts` — see voicePorts.ts's
 * header comment for why this split exists and what it makes testable.
 */
export class WordVoiceCore implements WordVoiceService {
  private speaking = false;

  constructor(private readonly ports: VoicePorts) {}

  async resolve(catId: CategoryId, word: string): Promise<VoiceSource> {
    const k = key(catId, word);

    // Step 1: a parent recording for this exact catId:word.
    try {
      const rec = await this.ports.getRecordingRef(k);
      if (rec) return { kind: 'parentRecording', uri: rec.uri };
    } catch {
      // storage failure — fall through to the next step rather than throw
    }

    // Step 2: a bundled Talki voice recording, if one exists. None do yet.
    const bundled = this.ports.getBundledVoiceUri(k);
    if (bundled != null) {
      return { kind: 'bundledVoice', uri: bundled };
    }

    // Step 3: he-IL system TTS.
    const availability = await this.ports.checkTtsAvailability();
    if (!availability.available) {
      return { kind: 'unavailable', reason: availability.reason ?? 'tts-unavailable' };
    }
    return { kind: 'tts', text: word };
  }

  async say(catId: CategoryId, word: string, opts: { core?: boolean } = {}): Promise<void> {
    this.cancel();
    const source = await this.resolve(catId, word);

    try {
      if (source.kind === 'parentRecording' || source.kind === 'bundledVoice') {
        await this.speakVia(() => this.ports.playUri(source.uri));
        return;
      }
      if (source.kind === 'tts') {
        const settings = await this.ports.readSettings();
        // Gated off — mirrors the intent of speakTTS's
        // `!settings.voice && !opts.core` check (index.html 1935). See
        // phase-04-report.md "Findings and drift": legacy's own say()
        // forces core:true unconditionally on this exact call
        // (index.html 1906), which would make the settings.voice toggle
        // have no effect on the fallback path at all — this port follows
        // the phase plan's explicit Tier 1 test list instead ("core
        // absent and settings.voice false does not speak").
        if (!settings.voice && !opts.core) {
          return;
        }
        await this.speakVia(() => this.ports.speakTts(source.text, settings.rate));
        return;
      }
      // 'unavailable' — stays usable, speaks nothing, never throws.
    } catch {
      this.speaking = false;
      this.ports.setVoicePromptPlaying(false);
    }
  }

  cancel(): void {
    this.ports.stopPlayback();
    this.ports.stopTts();
    if (this.speaking) {
      this.speaking = false;
      this.ports.setVoicePromptPlaying(false);
    }
  }

  async preload(catId: CategoryId): Promise<void> {
    // No in-memory cache layer exists yet (there is no app-state layer at
    // all as of Phase 3/4 — phase-03-report.md, "Risks carried into the
    // next phase"). This still exercises the same lookups
    // `preloadRecs(catId)` did (index.html 3921-3927), best-effort and
    // side-effect-free.
    const cat = (CATEGORIES as Record<string, { items: { word: string }[] }>)[catId];
    if (!cat) return;
    await Promise.allSettled(
      cat.items.map((item) => this.ports.getRecordingRef(key(catId, item.word)))
    );
  }

  private async speakVia(action: () => Promise<void>): Promise<void> {
    this.speaking = true;
    this.ports.setVoicePromptPlaying(true);
    try {
      await action();
    } finally {
      this.speaking = false;
      this.ports.setVoicePromptPlaying(false);
    }
  }
}
