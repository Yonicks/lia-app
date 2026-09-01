import type { HomePracticeCard, PracticeListEntry } from '../types';

/**
 * Ported verbatim from index.html 1383-1387 (HOME_PRACTICE_HOME) and
 * 2218-2225 (PRACTICE_LIST). Generated from
 * docs/migration/fixtures/legacy-domain.json — see
 * tools/extract-legacy-domain.mjs.
 */
export const HOME_PRACTICE_HOME: HomePracticeCard[] = [{"description": "מילה אחת, שמונה משפטים קצרים", "id": "focus", "title": "מילה במיקוד", "variant": "pink"},{"description": "מזהים בלי צורך לדבר", "id": "receptive", "title": "תראי לי", "variant": "lavender"},{"description": "עוצרים מילה לפני הסוף ומחכים", "id": "cloze", "title": "משלימים ביחד", "variant": "orange"}];

export const PRACTICE_LIST: PracticeListEntry[] = [["focus", "🎯", "מילה במיקוד", "מילה אחת, שמונה משפטים קצרים", "pc-1", "pink"],["receptive", "👈", "תראי לי", "מזהים בלי צורך לדבר", "pc-2", "lavender"],["cloze", "⏸️", "משלימים ביחד", "עוצרים מילה לפני הסוף ומחכים", "pc-3", "peach"],["temptation", "🫙", "הצנצנת", "משמיעים קול כדי לפתוח", "pc-4"],["pairs", "👂", "דומה אבל לא", "עֵץ או עֵז? מבחינים בין צלילים", "pc-5"],["combine", "➕", "שתי מילים", "מחברים \"עוד\" + מילה", "pc-6"]] as PracticeListEntry[];
