import { CATEGORIES } from "../api/types";
import type { Category } from "../api/types";

export interface CategorySegment {
  category: Category;
  count: number;
  /** 0..1 da circunferência */
  fraction: number;
  /** início acumulado (0..1) */
  offset: number;
}

export function categorySegments(byCategory: Record<Category, number>): { total: number; segments: CategorySegment[] } {
  const total = CATEGORIES.reduce((sum, c) => sum + Math.max(0, byCategory[c] ?? 0), 0);
  let acc = 0;
  const segments = CATEGORIES.map((category) => {
    const count = Math.max(0, byCategory[category] ?? 0);
    const fraction = total === 0 ? 0 : count / total;
    const seg = { category, count, fraction, offset: acc };
    acc += fraction;
    return seg;
  });
  return { total, segments };
}
