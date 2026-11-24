import Image from 'next/image';
import { ArrowRight, CloudOff, Plus } from 'lucide-react';
import { Tag } from '@/components/ui';
import { cx } from '@/lib/cx';
import attendantPhoto from '@/assets/photos/attendant-at-pump.jpg';

/**
 * The hero's picture: an attendant recording a sale at the pump, and on wide
 * screens the attendant app's home screen on a phone in front of the photo.
 * The photo is an AI-generated stand-in until real pilot-station photography
 * replaces it.
 *
 * The phone copies relai-mobile's home screen (app/home.tsx) part for part, at
 * the app's own size (390 wide) and scaled into the frame: station and name
 * with the shift clock, the sync banner, New sale, the shift's figures, and
 * recent sales with the undo strip under the newest one. Its figures are sample
 * data at the current pump prices (petrol RWF 2,938/L, diesel 2,927/L) and add
 * up: 468.0 L of petrol, 234.4 L of diesel and 48.5 kWh come to RWF 2,079,503.
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
        aria-label="The attendant app's home screen: Aline Uwase on shift at Kigali Central for 3 hours 25 minutes, one sale waiting to sync, the New sale button, 24 sales, 702.4 litres and RWF 2,079,503 so far, and the most recent sales"
        className="absolute top-50 left-105 hidden h-117.5 w-60 rounded-[calc(var(--radius-16)*2.125)] bg-sidebar-surface p-1.5 xl:block"
      >
        <div data-theme="light" className="h-full overflow-hidden rounded-[calc(var(--radius-14)*2)] bg-bg text-text">
          {/* The app's screen at 390 wide, scaled to the 228 the frame leaves. */}
          <div aria-hidden className="flex w-97.5 origin-top-left scale-[0.5846] flex-col gap-5 px-5 pt-3">
            <HomeScreen />
          </div>
        </div>
      </div>
    </div>
  );
}

/** relai-mobile app/home.tsx, drawn with the same tokens. */
function HomeScreen() {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-12 font-medium tracking-p80 text-text-muted uppercase">Kigali Central</span>
          <span className="text-17 font-semibold">Aline Uwase</span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-control bg-success-tint px-3 py-1.75">
          <span className="size-2 rounded-full bg-success" />
          <span className="font-mono text-16 font-semibold text-success">03:25:14</span>
        </span>
      </div>

      <div className="flex gap-3 rounded-control bg-warning-tint px-4 py-3">
        <CloudOff size={18} className="mt-0.5 shrink-0 text-warning" />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-14 font-semibold text-warning">1 sale waiting to sync</span>
          <span className="text-13 text-text-secondary">Saved on this phone. It sends when the internet is back.</span>
        </span>
        <span className="self-center text-13 font-semibold text-warning">Sync now</span>
      </div>

      <div className="flex items-center gap-4 rounded-16 bg-primary p-5 text-on-primary">
        <span className="inline-flex size-13 shrink-0 items-center justify-center rounded-card bg-on-primary-overlay">
          <Plus size={26} />
        </span>
        <span className="flex flex-1 flex-col gap-1">
          <span className="text-22 font-semibold">New sale</span>
          <span className="text-14">Pump 1 is selected from your last sale</span>
        </span>
        <ArrowRight size={22} />
      </div>

      <div className="flex gap-2.5">
        <Stat label="Sales" value="24" unit="since 06:00" />
        <Stat label="Litres" value="702.4" unit="dispensed" />
        {/* The app shrinks a long figure to fit; a nine-character revenue ends up at about 16. */}
        <Stat label="RWF" value="2,079,503" unit="revenue" small />
      </div>

      <div className="flex min-h-7 items-center justify-between">
        <span className="text-20 font-semibold tracking-n10">Recent sales</span>
        <span className="text-15 font-medium text-link">See all 24</span>
      </div>

      <div className="overflow-hidden rounded-card-lg border border-border bg-surface">
        {SALES.map((s, i) => (
          <div key={s.time}>
            <div className={cx('flex items-center gap-3 px-4 py-3.5', i > 0 && 'border-t border-border')}>
              <Tag color={s.color}>{s.badge}</Tag>
              <span className="flex flex-1 flex-col gap-0.75">
                <span className="font-mono text-16 font-semibold">{s.quantity}</span>
                <span className="font-mono text-13 text-text-secondary">{s.amount}</span>
              </span>
              <span className="flex flex-col items-end gap-1.5">
                <span className="font-mono text-12 text-text-muted">{s.time}</span>
                <span className="rounded-chip bg-surface-muted px-1.75 py-0.75 text-12 font-medium text-text-secondary">{s.payment}</span>
              </span>
            </div>
            {s.undo ? (
              <div className="flex min-h-11 items-center gap-2.5 bg-warning-tint px-4">
                <CloudOff size={16} className="shrink-0 text-warning" />
                <span className="flex-1 text-14 text-warning">Not synced yet · undo for {s.undo}</span>
                <span className="text-15 font-medium text-warning">Undo</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

/** Newest first. The first is still on the phone, so it can be undone and has not synced. */
const SALES = [
  { badge: 'GAS', color: 'var(--product-gasoline)', quantity: '20.0 L', amount: 'RWF 58,760', time: '09:24', payment: 'MoMo', undo: '1:42' },
  { badge: 'DSL', color: 'var(--product-diesel)', quantity: '40.0 L', amount: 'RWF 117,080', time: '09:18', payment: 'Balance', undo: null },
  { badge: 'GAS', color: 'var(--product-gasoline)', quantity: '3.4 L', amount: 'RWF 10,000', time: '09:11', payment: 'Cash', undo: null },
  { badge: 'DC', color: 'var(--product-ev-dc)', quantity: '32.0 kWh', amount: 'RWF 12,160', time: '09:02', payment: 'Voucher', undo: null },
];

/** relai-mobile Stat: a Mono caps label, the figure, a quiet unit line. */
function Stat({ label, value, unit, small = false }: { label: string; value: string; unit: string; small?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-card border border-border bg-surface p-3.5">
      <span className="font-mono text-11 font-medium tracking-p80 text-text-muted uppercase">{label}</span>
      <span className={cx('font-mono font-semibold tracking-n20 whitespace-nowrap', small ? 'text-16' : 'text-22')}>{value}</span>
      <span className="text-12 text-text-muted">{unit}</span>
    </span>
  );
}
