/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Smart Pareto Long-Tail Aggregator
 * Automatically groups low-frequency write-in / 'Other' options into 'Lainnya'
 */

export interface AggregatedItem {
  name: string;
  value: number;
  isAggregated?: boolean;
  originalCount?: number;
  subItems?: string[];
}

export interface LongTailResult {
  items: AggregatedItem[];
  hasCollapsed: boolean;
  collapsedCount: number;
  totalCollapsedValue: number;
}

/**
 * Check whether a dataset qualifies for smart long-tail collapsing
 */
export function canCollapseLongTail(
  items: Array<{ name: string; value: number }>,
  thresholdCount = 1
): boolean {
  if (items.length <= 7) return false;
  const minorItems = items.filter((item) => item.value <= thresholdCount);
  return minorItems.length >= 2;
}

/**
 * Collapses long-tail items into a consolidated 'Lainnya' category
 */
export function collapseLongTail(
  items: Array<{ name: string; value: number }>,
  enabled = true,
  thresholdCount = 1
): LongTailResult {
  if (!enabled || !canCollapseLongTail(items, thresholdCount)) {
    return {
      items: items.map((i) => ({ ...i })),
      hasCollapsed: false,
      collapsedCount: 0,
      totalCollapsedValue: 0,
    };
  }

  const prominentItems: AggregatedItem[] = [];
  const tailItems: Array<{ name: string; value: number }> = [];

  for (const item of items) {
    if (item.value <= thresholdCount) {
      tailItems.push(item);
    } else {
      prominentItems.push({ ...item });
    }
  }

  // If there are at least 2 minor items, collapse them
  if (tailItems.length >= 2) {
    const totalCollapsedValue = tailItems.reduce((sum, item) => sum + item.value, 0);
    const subItems = tailItems.map((t) => t.name);

    prominentItems.push({
      name: `Lainnya (${tailItems.length} opsi)`,
      value: totalCollapsedValue,
      isAggregated: true,
      originalCount: tailItems.length,
      subItems,
    });

    return {
      items: prominentItems,
      hasCollapsed: true,
      collapsedCount: tailItems.length,
      totalCollapsedValue,
    };
  }

  return {
    items: items.map((i) => ({ ...i })),
    hasCollapsed: false,
    collapsedCount: 0,
    totalCollapsedValue: 0,
  };
}
