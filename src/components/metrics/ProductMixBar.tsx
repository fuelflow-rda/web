'use client';

import React from 'react';
import { Empty, Tooltip } from 'antd';
import { formatRWF } from '@/lib/format';
import { formatQuantity, productColor, productShortLabel } from '@/lib/product-types';
import type { ProductType, ProductUnit } from '@/types';

export interface ProductMixRow {
  productType: ProductType;
  label: string;
  unit: ProductUnit;
  revenue: number;
  quantity: number;
  transactions: number;
  /** Percentage of total revenue. */
  share: number;
}

/**
 * Revenue split across products, as one stacked bar plus a legend.
 *
 * A stacked bar beats a pie here because the question is "how much of the business is
 * electric yet", which is a part-to-whole comparison people read far more accurately
 * from length than from angle. Every segment is labelled — colour alone would leave
 * the ochre and the sage greens indistinguishable for red-green colour blindness.
 */
export default function ProductMixBar({ data }: { data: ProductMixRow[] }) {
  const rows = data.filter((d) => d.revenue > 0);

  if (rows.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Empty description={<span className="text-ink-muted">No sales in this period</span>} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-surface-muted">
        {rows.map((row) => (
          <Tooltip
            key={row.productType}
            title={`${row.label} — ${formatRWF(row.revenue)} (${row.share}%)`}
          >
            <div
              style={{ width: `${row.share}%`, background: productColor(row.productType) }}
              className="h-full"
            />
          </Tooltip>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <div key={row.productType} className="flex items-center gap-3 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: productColor(row.productType) }}
              aria-hidden
            />
            <span className="text-ink font-medium flex-1 min-w-0 truncate" title={row.label}>
              {productShortLabel(row.productType)}
            </span>
            <span className="text-ink-muted tabular-nums text-xs shrink-0">
              {formatQuantity(row.quantity, row.unit, 0)}
            </span>
            <span className="text-ink font-semibold tabular-nums w-28 text-right shrink-0">
              {formatRWF(row.revenue)}
            </span>
            <span className="text-ink-muted tabular-nums w-12 text-right text-xs shrink-0">
              {row.share}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
