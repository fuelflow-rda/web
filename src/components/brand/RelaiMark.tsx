/**
 * The Relai mark, the "Relay Loop": a monoline R whose bowl closes back on
 * the stem (books that balance), with a champagne node at the end of the leg.
 *
 * Geometry from the Pencil logo board: a 48-unit grid, 6-unit stroke. Below
 * 20 px the stroke thickens to 7 units, as the board's 16 px favicon does, so
 * the loop does not thin to a hairline.
 *
 * The stroke is `currentColor`; the node is always champagne (`--accent`,
 * the same in both themes).
 */
export const MARK_PATH = 'M13 44 V14 A6 6 0 0 1 19 8 H23 A9.5 9.5 0 0 1 23 27 H13 M21 27 L28.94 34.94';
export const MARK_NODE = { cx: 34.6, cy: 40.6, r: 4 } as const;

export function RelaiMark({
  size = 24,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Give the mark a name when it stands alone; omit it beside the wordmark. */
  title?: string;
}) {
  const strokeWidth = size < 20 ? 7 : 6;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d={MARK_PATH} stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle {...MARK_NODE} fill="var(--accent)" />
    </svg>
  );
}
