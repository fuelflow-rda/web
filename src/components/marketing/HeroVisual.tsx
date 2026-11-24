import Image from 'next/image';
import { CloudOff, Plus } from 'lucide-react';
import { Tag } from '@/components/ui';
import { cx } from '@/lib/cx';
import attendantPhoto from '@/assets/photos/attendant-at-pump.jpg';

/**
 * The hero's picture: an attendant recording a sale at the pump, and on wide
 * screens the attendant app on a phone in front of the photo. The photo is an
 * AI-generated stand-in until real pilot-station photography replaces it. The
 * phone is drawn from the same tokens as the real screen; its figures are
 * sample data at the current pump prices (petrol RWF 2,938/L, diesel 2,927/L).
 */
export function HeroVisual() {
  return (
    // The design's frame on wide screens: 560 by 672 (the phone's full height), the photo 600 wide from the
    // left, the phone overlapping it at 420. Between 1280 and 1440 wide it is scaled down to stay on screen.
    // Below that the photo alone sits under the text.
    <div className="relative xl:h-168 xl:w-140 xl:origin-top-left xl:max-[1439px]:scale-[0.88]">
      <div className="relative aspect-square overflow-hidden rounded-16 sm:aspect-4/3 xl:absolute xl:top-14 xl:left-0 xl:aspect-auto xl:h-130 xl:w-150">
        <Image
          src={attendantPhoto}
          alt="A station attendant in a green vest smiles as she records a sale on her phone beside the pump"
          fill
          priority
          placeholder="blur"
          sizes="(min-width: 1280px) 600px, (min-width: 768px) 90vw, 100vw"
          // Keeps the attendant in frame and the car's badge, model name and number plate out of it at every width.
          className="object-cover object-[38%_50%] sm:object-[15%_50%] xl:object-[38%_50%]"
        />
      </div>

      <div
        role="img"
        aria-label="The attendant app on a phone, listing the shift's recent sales and one sale waiting to sync"
        className="absolute top-50 left-105 hidden h-117.5 w-60 rounded-[calc(var(--radius-16)*2.125)] bg-sidebar-surface p-1.5 xl:block"
      >
        <div data-theme="light" className="flex h-full flex-col gap-3 overflow-hidden rounded-[calc(var(--radius-14)*2)] bg-bg p-3 text-text">
          <div className="flex items-center justify-between pt-2">
            <span className="text-13 font-semibold">Aline Uwase</span>
            <span className="inline-flex items-center gap-1.5 rounded-control bg-success-tint px-2 py-1 font-mono text-11 font-semibold text-success">
              <span className="size-1.5 rounded-full bg-success" />
              03:25
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-12 bg-primary px-4 py-3 text-on-primary">
            <Plus size={18} />
            <span className="text-16 font-semibold">New sale</span>
          </div>
          <div className="overflow-hidden rounded-12 border border-border bg-surface">
            {[
              { tag: 'GAS', color: 'var(--product-gasoline)', q: '20.0 L', rwf: 'RWF 58,760', t: '21:39' },
              { tag: 'GAS', color: 'var(--product-gasoline)', q: '40.0 L', rwf: 'RWF 117,520', t: '21:26' },
              { tag: 'DSL', color: 'var(--product-diesel)', q: '11.1 L', rwf: 'RWF 32,490', t: '21:02' },
              { tag: 'EV', color: 'var(--product-ev-dc)', q: '38.5 kWh', rwf: 'RWF 14,630', t: '20:51' },
            ].map((s, i) => (
              <div key={s.t} className={cx('flex items-center gap-2.5 px-3 py-2.5', i > 0 && 'border-t border-border')}>
                <Tag color={s.color}>{s.tag}</Tag>
                <span className="flex flex-1 flex-col">
                  <span className="font-mono text-13 font-semibold">{s.q}</span>
                  <span className="font-mono text-11 whitespace-nowrap text-text-secondary">{s.rwf}</span>
                </span>
                <span className="font-mono text-11 text-text-muted">{s.t}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-control bg-warning-tint px-3 py-2.5 text-12 font-semibold text-warning">
            <CloudOff size={14} />1 sale waiting to sync
          </div>
        </div>
      </div>
    </div>
  );
}
