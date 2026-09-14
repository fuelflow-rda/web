'use client';

import React from 'react';
import { Button, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/store/theme-store';

/**
 * A text-level control: the header already has enough weight, and the system
 * allows only one filled button per screen.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const next = mode === 'dark' ? 'light' : 'dark';

  return (
    <Tooltip title={`Switch to ${next} theme`}>
      <Button
        type="text"
        aria-label={`Switch to ${next} theme`}
        icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggle}
        className={className}
      />
    </Tooltip>
  );
}
