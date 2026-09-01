import type { ClozeEntry, ModifierEntry, PairEntry } from '../types';
import { art } from '../vocabulary/art';

/**
 * Ported verbatim from index.html 1594-1628 (CARRIERS, CLOZE, PAIRS,
 * MODIFIERS). Generated from docs/migration/fixtures/legacy-domain.json —
 * see tools/extract-legacy-domain.mjs. Image references are re-derived via
 * art(cat, slug) rather than copied as raw path strings, matching how
 * index.html itself builds them (e.g. CLOZE reuses art('numbers','three'),
 * the same image CATEGORIES.numbers already uses for that word).
 */
export const CARRIERS: string[] = ["הִנֵּה {w}","עוֹד {w}","וַואו, {w}!","אֵיפֹה {w}?","זֶה {w}","{w} שֶׁלִּי","בַּיי בַּיי {w}","אֲנִי רוֹאָה {w}"];

export const CLOZE: ClozeEntry[] = [
  { phrase: "אֶחָד, שְׁתַּיִם, ...", answer: "שָׁלוֹשׁ", emoji: "3️⃣", img: art("numbers", "three") },
  { phrase: "מוּכָנִים, הִכּוֹן, ...", answer: "צֵא", emoji: "🏃", img: art("actions", "running") },
  { phrase: "הַכֶּלֶב אוֹמֵר ...", answer: "הַב הַב", emoji: "🐶", img: art("animals", "dog") },
  { phrase: "הַפָּרָה אוֹמֶרֶת ...", answer: "מוּ", emoji: "🐮", img: art("animals", "cow") },
  { phrase: "בְּבַקָּשָׁה וְ...", answer: "תּוֹדָה", emoji: "🙏" },
  { phrase: "לַיְלָה טוֹב, לַיְלָה ...", answer: "טוֹב", emoji: "🌙", img: art("colors", "moon") },
  { phrase: "אֲנִי רוֹצָה עוֹד ...", answer: "מַיִם", emoji: "💧", img: art("food", "water") },
  { phrase: "הַחָתוּל אוֹמֵר ...", answer: "מְיָאוּ", emoji: "🐱", img: art("animals", "cat") },
];

export const PAIRS: PairEntry[] = [
  [{ word: "עֵץ", emoji: "🌳", img: art("outside", "tree") }, { word: "עֵז", emoji: "🐐" }],
  [{ word: "יָד", emoji: "✋", img: art("body", "hand") }, { word: "יָם", emoji: "🌊", img: art("outside", "sea") }],
  [{ word: "בַּיִת", emoji: "🏠", img: art("outside", "house") }, { word: "זַיִת", emoji: "🫒" }],
  [{ word: "סִיר", emoji: "🍲" }, { word: "שִׁיר", emoji: "🎵" }],
  [{ word: "כַּף", emoji: "🥄", img: art("home", "spoon") }, { word: "כַּד", emoji: "🏺" }],
  [{ word: "דֹּב", emoji: "🐻", img: art("animals", "bear") }, { word: "דָּג", emoji: "🐟", img: art("animals", "fish") }],
  [{ word: "תַּפּוּחַ", emoji: "🍎", img: art("food", "apple") }, { word: "תַּפּוּז", emoji: "🍊", img: art("food", "orange") }],
];

export const MODIFIERS: ModifierEntry[] = [
  { w: "עוֹד", emoji: "➕", expand: "אֲנִי רוֹצָה עוֹד {w}" },
  { w: "אֵין", emoji: "🚫", expand: "אֵין יוֹתֵר {w}" },
  { w: "גָּדוֹל", emoji: "🐘", img: art("animals", "elephant"), expand: "אֵיזֶה {w} גָּדוֹל" },
  { w: "שֶׁלִּי", emoji: "🤗", img: art("actions", "hugging"), expand: "זֶה {w} שֶׁלִּי" },
];
