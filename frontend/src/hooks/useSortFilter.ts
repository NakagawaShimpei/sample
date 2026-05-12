import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export function useSortFilter<T>(
  data: T[],
  columnFilterFn: (item: T, filters: Record<string, string>) => boolean,
  sortValueFn?: (item: T, key: string) => string | number,
) {
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const setFilter = (key: string, value: string) => {
    setFiltersState((prev) => {
      if (value === '') {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const clearFilters = () => setFiltersState({});

  const hasActiveFilter = Object.keys(filters).length > 0;

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const items = useMemo(() => {
    const lowered = Object.fromEntries(
      Object.entries(filters).map(([k, v]) => [k, v.toLowerCase()]),
    );

    const filtered =
      Object.keys(lowered).length > 0
        ? data.filter((item) => columnFilterFn(item, lowered))
        : data;

    if (!sortKey || !sortValueFn) return filtered;

    return [...filtered].sort((a, b) => {
      const av = sortValueFn(a, sortKey);
      const bv = sortValueFn(b, sortKey);
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'ja');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filters, sortKey, sortDir]);

  return { filters, setFilter, clearFilters, hasActiveFilter, sortKey, sortDir, toggleSort, items };
}
