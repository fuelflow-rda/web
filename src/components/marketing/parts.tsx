import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

/**
 * Building blocks of the public pages (Pencil "Landing / Home"). The frame
 * follows the visitor's theme; the night sections (hero, contact, footer)
 * carry data-theme="dark" in both, so the same tokens give each part its
 * colours. `nightEdge` gives a night block a hairline when the page around it
 * is dark too.
 */

/** A border on a night block, only when the whole page is dark: there the block would otherwise vanish. */
export const nightEdge = '[:root[data-theme=dark]_&]:border [:root[data-theme=dark]_&]:border-border';

/** 1200 px of content, centred, with the page's side margins on smaller screens. */
export const container = 'mx-auto w-full max-w-300 px-5 sm:px-8 xl:px-0';

/** "PLATFORM": Geist Mono caps above a heading. */
export function Overline({ children, tone = 'accent-text', className }: { children: ReactNode; tone?: 'accent-text' | 'accent' | 'inverse-accent' | 'text-muted'; className?: string }) {
  const colour = { 'accent-text': 'text-accent-text', accent: 'text-accent', 'inverse-accent': 'text-inverse-accent', 'text-muted': 'text-text-muted' }[tone];
  return <p className={cx('m-0 font-mono text-13 font-medium tracking-p80 uppercase', colour, className)}>{children}</p>;
}

/** A section's serif heading, 56 px on wide screens. */
export function Display({ id, children, size = 56, className }: { id?: string; children: ReactNode; size?: 48 | 56; className?: string }) {
  return (
    <h2
      id={id}
      className={cx(
        'm-0 font-display font-normal leading-[1.05] tracking-n10',
        size === 56 ? 'text-40 lg:text-56' : 'text-40 lg:text-48',
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Overline, heading and an optional lead paragraph. */
export function SectionHead({
  overline,
  title,
  titleId,
  lead,
  className,
}: {
  overline: string;
  title: ReactNode;
  titleId: string;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex max-w-190 flex-col gap-4.5', className)}>
      <Overline>{overline}</Overline>
      <Display id={titleId}>{title}</Display>
      {lead ? <p className="m-0 text-17 leading-[1.55] text-text-secondary lg:text-18">{lead}</p> : null}
    </div>
  );
}

/** The product colours, in the order the hero lists them. */
export const PRODUCTS = [
  { label: 'Gasoline', dot: 'bg-product-gasoline' },
  { label: 'Diesel', dot: 'bg-product-diesel' },
  { label: 'EV AC', dot: 'bg-product-ev-ac' },
  { label: 'EV DC fast', dot: 'bg-product-ev-dc' },
  { label: 'EV DC ultra', dot: 'bg-product-ev-ultra' },
] as const;
