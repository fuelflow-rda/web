'use client';

import React from 'react';
import { Avatar } from 'antd';

/** "Aline Uwase" becomes "AU"; a single word gives its first two letters. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Identity chip for people and companies in tables. Initials read faster than a
 * generic icon repeated down a column, and the tint keeps it quieter than the
 * accent so it never competes with a button.
 */
export function InitialsAvatar({
  name,
  size = 36,
  square = false,
}: {
  name: string;
  size?: number;
  square?: boolean;
}) {
  return (
    <Avatar
      size={size}
      shape={square ? 'square' : 'circle'}
      className="!bg-accent-tint !text-accent !font-semibold flex-shrink-0"
      style={{ fontSize: Math.round(size * 0.36), borderRadius: square ? 8 : undefined }}
    >
      {initials(name)}
    </Avatar>
  );
}
