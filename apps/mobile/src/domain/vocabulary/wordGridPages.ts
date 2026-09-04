/**
 * Chunks a category's words into landscape word-grid pages.
 * Page size comes from centralized landscape tokens (columns × rows).
 * Order is preserved; incomplete final pages are allowed (empty slots are
 * padded by `LandscapeWordGrid`).
 */
export function wordGridPages<T>(items: readonly T[], pageSize: number): T[][] {
  if (pageSize < 1) throw new Error('wordGridPages: pageSize must be >= 1');
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize) as T[]);
  }
  return pages.length > 0 ? pages : [[]];
}

/** Columns × rows for one landscape vocabulary page. */
export function wordGridPageSize(columns: number, rows: number): number {
  if (columns < 1 || rows < 1) throw new Error('wordGridPageSize: columns and rows must be >= 1');
  return columns * rows;
}
