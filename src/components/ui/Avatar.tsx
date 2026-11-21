import { cx } from '@/lib/cx';

/** First letter of the first two words: "Aline Uwase" is AU. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export interface AvatarProps {
  name: string;
  className?: string;
}

/** A 32px circle with initials. The name is given to assistive tech; the letters are hidden. */
export function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-12 font-semibold text-text-secondary',
        className,
      )}
    >
      <span aria-hidden>{initialsOf(name)}</span>
    </span>
  );
}
