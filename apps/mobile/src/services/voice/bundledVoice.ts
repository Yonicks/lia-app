/**
 * Step 2 of word-voice resolution: a bundled Talki-recorded voice for a
 * given `catId:word`, shipped with the app rather than recorded by a
 * parent. No such assets exist yet — this registry is deliberately always
 * empty (phase-04-plan.md, "Step 2 does not exist yet and has no assets.
 * Build it anyway"). The long-term intent is to replace robotic system TTS
 * with consistent recorded Talki voice; wiring the resolution step in now
 * means a future phase only has to populate this map, not touch every game
 * screen that calls `WordVoiceService.say()`.
 */
export const BUNDLED_VOICE: Record<string, number> = {};

export function bundledVoiceModuleFor(catIdColonWord: string): number | undefined {
  return BUNDLED_VOICE[catIdColonWord];
}
