'use client';

import { Dropdown } from 'antd';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { focusRing } from './focus';

export interface RowMenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * The "•••" at the end of a table row (Pencil tables): a 32px button opening
 * the row's actions. Clicks stop here, so a row that opens on click does not
 * open as well.
 */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  return (
    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: items.map((item) => ({
            key: item.key,
            label: item.label,
            danger: item.danger,
            disabled: item.disabled,
            icon: item.icon ? <item.icon size={14} aria-hidden /> : undefined,
          })),
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            items.find((i) => i.key === key)?.onClick();
          },
        }}
      >
        <button
          type="button"
          aria-label={label}
          className={cx(
            'inline-flex size-8 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-text-muted hover:bg-surface-muted hover:text-text',
            focusRing,
          )}
        >
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </Dropdown>
    </span>
  );
}
