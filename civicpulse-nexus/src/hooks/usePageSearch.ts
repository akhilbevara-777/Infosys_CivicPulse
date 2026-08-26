import { useMemo } from 'react';
import { useSearchStore } from '../store/searchStore';

/**
 * Returns items filtered by the global search query.
 * `fields` is an array of dot-path strings to search within each item.
 *
 * Usage:
 *   const filtered = usePageSearch(grievances, ['title','grievanceId','category','assignedDept','status']);
 */
export function usePageSearch<T extends Record<string, unknown>>(
  items: T[],
  fields: string[],
): { filtered: T[]; query: string; hasQuery: boolean } {
  const query = useSearchStore(s => s.query);
  const q     = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return items;
    return items.filter(item =>
      fields.some(field => {
        // Support nested dot paths e.g. 'user.name'
        const val = field.split('.').reduce<unknown>((obj, key) =>
          obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined, item);
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [items, q, fields.join(',')]);

  return { filtered, query: q, hasQuery: q.length > 0 };
}
