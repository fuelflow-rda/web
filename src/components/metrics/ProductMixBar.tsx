'use client';

import React from 'react';
import Link from 'next/link';
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
export default function ProductMixBar({
  data,
  hrefFor,
}: {
  data: ProductMixRow[];
  /** Where a product leads, e.g. its transactions. Omit for a static bar. */
  hrefFor?: (row: ProductMixRow) => string;
}) {
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
            {hrefFor ? (
              <Link
                href={hrefFor(row)}
                style={{ width: `${row.share}%`, background: productColor(row.productType) }}
                className="h-full block hover:opacity-80"
                aria-label={`${row.label} transactions`}
              />
            ) : (
              <div
                style={{ width: `${row.share}%`, background: productColor(row.productType) }}
                className="h-full"
              />
            )}
          </Tooltip>
        ))}
      </div>

      <div className="mt-4 space-y-1">
        {rows.map((row) => {
          const content = (
            <>

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
            </>
          );
          const rowClass = 'flex items-center gap-3 text-sm -mx-2 px-2 py-1 rounded-lg';
          return hrefFor ? (
            <Link
              key={row.productType}
              href={hrefFor(row)}
              className={`${rowClass} hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`}
            >
              {content}
            </Link>
          ) : (
            <div key={row.productType} className={rowClass}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
