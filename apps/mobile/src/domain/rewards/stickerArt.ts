import { V2_ASSETS } from '../../data/assets/v2.generated';
import type { Sticker } from '../types';

/** Maps `STICKERS[].img` (e.g. `talki-sticker-dog.png`) onto the bundled PNG. */
export function stickerImage(sticker: Sticker): number | undefined {
  return V2_ASSETS[`assets/v2/stickers/${sticker.img}`];
}
