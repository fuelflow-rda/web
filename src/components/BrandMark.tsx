import { RelaiMark } from './brand/RelaiMark';

/**
 * The Relai mark, for older call sites that pass a size and a colour.
 * New code uses `RelaiMark` or `RelaiLockup` from `@/components/brand`.
 *
 * The stroke takes `color`; the node stays champagne.
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
    <span className={['inline-flex', className].filter(Boolean).join(' ')} style={{ color }}>
      <RelaiMark size={size} />
    </span>
  );
}
