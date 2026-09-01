/**
 * The single registry of test identifiers used across the native app.
 * Specs import from here rather than hardcoding strings, so a rename is a
 * one-file change instead of a grep-and-pray across every spec.
 */
export const testIds = {
  bootstrap: {
    root: 'bootstrap-root',
    title: 'bootstrap-title',
  },
} as const;
