import { cx } from '@/lib/cx';
import { RelaiMark } from './RelaiMark';

/**
 * Mark and wordmark together, as on the sidebar. The wordmark is Geist 600
 * "relaı" (dotless i) with the champagne node standing in for the dot.
 *
 * Every position is in em of the wordmark size, taken from the Pencil lockup
 * (wordmark 27 px, box 78 × 25 px), so it scales by font size alone. The box
 * hugs the drawn mark, so the stroke starts flush with the left edge.
 */
export function RelaiLockup({
  height = 25,
  className,
}: {
  /** Height of the lockup in px; the design's sidebar uses 25. */
  height?: number;
  className?: string;
}) {
  const fontSize = (height * 27) / 25;
  return (
    <span
      role="img"
      aria-label="Relai"
      className={cx('relative inline-block shrink-0 align-middle', className)}
      style={{ fontSize, width: '2.889em', height: '0.926em' }}
    >
      <span aria-hidden className="absolute" style={{ left: '-0.2311em', top: '-0.1156em', width: '1.111em', height: '1.111em' }}>
        <RelaiMark size={(fontSize * 30) / 27} className="block h-full w-full" />
      </span>
      <span
        aria-hidden
        className="absolute font-sans font-semibold leading-none tracking-n20 whitespace-nowrap"
        style={{ left: '0.9067em', top: '0.093em' }}
      >
        relaı
        <span
          className="absolute rounded-full bg-accent"
          style={{ left: 'calc(1.8825em - 0.07em)', top: 'calc(0.19em - 0.07em)', width: '0.14em', height: '0.14em' }}
        />
      </span>
    </span>
  );
}
