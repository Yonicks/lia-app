const expoConfig = require('eslint-config-expo/flat');

// Talki is Hebrew and right-to-left; a physical left/right layout prop is
// wrong on every screen and invisible to a developer reading English code
// (phase-05-plan.md "RTL through logical properties, always"). This forbids
// the physical style keys in favour of their logical equivalents
// (marginStart/End, paddingStart/End, insetInlineStart/End, start/end, ...).
const FORBIDDEN_PHYSICAL_STYLE_KEYS = [
  'left',
  'right',
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
];

const noPhysicalLayoutProps = {
  selector: FORBIDDEN_PHYSICAL_STYLE_KEYS.map((key) => `Property[key.name="${key}"]`).join(', '),
  message:
    'No left/right layout props — use the logical equivalent (start/end) so RTL flips correctly. See design-system/rtl/logical.ts.',
};

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'tests/e2e/**/__screenshots__/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', noPhysicalLayoutProps],
    },
  },
];
