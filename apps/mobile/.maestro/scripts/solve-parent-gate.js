/* global maestro, output */
/**
 * Reads the parent-gate question Maestro copied (`7 × 4 = ?`) and exposes
 * digits for `tapOn: id: parent-gate-key-${output.d0}` etc.
 * a ∈ 3..9, b ∈ 2..9 → product is 1 or 2 digits.
 */
const text = String(maestro.copiedText || '');
const m = text.match(/(\d+)\D+(\d+)/);
const product = m ? String(Number(m[1]) * Number(m[2])) : '';
output.d0 = product.charAt(0);
output.d1 = product.charAt(1);
output.hasD1 = product.length > 1 ? 'true' : 'false';
