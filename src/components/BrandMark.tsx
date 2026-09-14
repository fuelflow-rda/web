import React from 'react';

/**
 * The Relai mark: a drop of fuel with a bolt struck through it, tipped forward so it
 * reads as flowing rather than falling — litres and kilowatt hours in one shape.
 *
 * Kept here rather than inlined at each call site: the glyph previously existed as
 * six copies of the same path, so rebranding meant finding all six.
 *
 * Draws in `currentColor`, so the caller sets the colour the usual way. Every current
 * use sits on an accent-filled tile and passes `var(--accent-on)`.
 *
 * The source of truth for the artwork is `public/brand/relai-mark.svg`; this mirrors
 * it so the app never pays a network request to draw its own logo.
 */
export function BrandMark({
  size = 20,
  color = 'currentColor',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={{ color }}
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(-18 24 24)">
        <path
          fillRule="evenodd"
          fill="currentColor"
          d="M24 4C24 4 38 20 38 29A14 14 0 0 1 10 29C10 20 24 4 24 4ZM26.4 16.5L17.6 30.5H22.2L21.6 40L30.4 26.5H25.6Z"
        />
      </g>
    </svg>
  );
}
