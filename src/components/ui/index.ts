/**
 * The design system's base components (Pencil "Components" board). Everything
 * here takes its values from the design tokens; feature code composes these
 * rather than styling raw elements.
 *
 * Segmented and Tabs are antd's own, styled entirely by the antd theme
 * (src/theme/antd-theme.ts), so they are re-exported unchanged.
 */
export { Avatar, initialsOf } from './Avatar';
export { Banner, type BannerTone } from './Banner';
export { Button, type ButtonKind } from './Button';
export { Checkbox } from './Checkbox';
export { focusRing } from './focus';
export { IconButton } from './IconButton';
export { KpiTile, type KpiDelta } from './KpiTile';
export { NavItem } from './NavItem';
export { PageHeader } from './PageHeader';
export { Panel } from './Panel';
export { StatusChip, type StatusTone } from './StatusChip';
export { Tag } from './Tag';
export { TextField } from './TextField';
export { Toggle } from './Toggle';
export { Segmented, Tabs } from 'antd';
