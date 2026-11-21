import type { ReactNode } from 'react';
import { CloudOff, Plus, TrendingUp } from 'lucide-react';
import { Tag } from '@/components/ui';
import { cx } from '@/lib/cx';

/**
 * The hero's picture of the product: the dashboard's overview with a
 * reconciliation, and the attendant app on a phone in front of it. Drawn from
 * the same tokens as the real screens rather than shipped as an image, and named
 * once for assistive tech; the figures inside are sample data.
 */
export function HeroVisual() {
  return (
    <div
      role="img"
      aria-label="The Relai dashboard showing today's revenue, fuel dispensed and a reconciliation, beside the attendant app on a phone listing recent sales"
      // The design's frame: 560 by 640, the window 600 wide from the left, the phone
      // overlapping it at 420. Between 1280 and 1440 wide it is scaled down to stay on screen.
      className="relative h-160 w-140 origin-top-left max-[1439px]:scale-[0.88]"
    >
      <div aria-hidden data-theme="light" className="absolute top-14 left-0 h-130 w-150 overflow-hidden rounded-16 border border-border bg-bg text-text">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-5 py-3">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-border" />
          ))}
          <span className="ml-2 text-12 font-medium text-text-muted">Overview · Kigali Central</span>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Revenue today" unit="RWF" value="1,284,500" note={<span className="inline-flex items-center gap-1 text-success"><TrendingUp size={14} />8.2% vs yesterday</span>} />
            <Kpi label="Fuel dispensed" value="786.4" suffix="L" note="Gasoline 512.0 · Diesel 274.4" />
          </div>
          <div className="overflow-hidden rounded-12 border border-border bg-surface">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-14 font-semibold">Reconciliation · Thursday</span>
              <span className="font-mono text-12 text-text-muted">ran 02:00</span>
            </div>
            {[
              { pump: 'Pump 2', tag: 'DSL', color: 'var(--product-diesel)', value: '−3.2 L', bad: true },
              { pump: 'Pump 1', tag: 'GAS', color: 'var(--product-gasoline)', value: '−0.4 L', bad: false },
              { pump: 'Charger 1', tag: 'EV DC', color: 'var(--product-ev-dc)', value: '0.0 kWh', bad: false },
            ].map((r) => (
              <div key={r.pump} className={cx('flex items-center gap-4 border-t border-border px-4 py-2.5', r.bad && 'bg-danger-tint')}>
                <span className="w-20 text-13 font-semibold">{r.pump}</span>
                <Tag color={r.color}>{r.tag}</Tag>
                <span className={cx('ml-auto font-mono text-13 font-semibold', r.bad ? 'text-danger' : 'text-text')}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden className="absolute top-50 left-105 h-117.5 w-60 rounded-[calc(var(--radius-16)*2.125)] bg-sidebar-surface p-1.5">
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
              { tag: 'GAS', color: 'var(--product-gasoline)', q: '20.0 L', rwf: 'RWF 32,660', t: '21:39' },
              { tag: 'GAS', color: 'var(--product-gasoline)', q: '40.0 L', rwf: 'RWF 65,320', t: '21:26' },
              { tag: 'DSL', color: 'var(--product-diesel)', q: '11.1 L', rwf: 'RWF 17,927', t: '21:02' },
              { tag: 'EV', color: 'var(--product-ev-dc)', q: '38.5 kWh', rwf: 'RWF 14,630', t: '20:51' },
            ].map((s, i) => (
              <div key={s.t} className={cx('flex items-center gap-2.5 px-3 py-2.5', i > 0 && 'border-t border-border')}>
                <Tag color={s.color}>{s.tag}</Tag>
                <span className="flex flex-1 flex-col">
                  <span className="font-mono text-13 font-semibold">{s.q}</span>
                  <span className="font-mono text-11 text-text-secondary">{s.rwf}</span>
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

function Kpi({ label, value, unit, suffix, note }: { label: string; value: string; unit?: string; suffix?: string; note: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-12 border border-border bg-surface p-4">
      <span className="font-mono text-11 font-medium tracking-p80 text-text-muted uppercase">{label}</span>
      <span className="flex items-baseline gap-1.5">
        {unit ? <span className="text-13 text-text-secondary">{unit}</span> : null}
        <span className="font-mono text-24 font-medium tracking-n15">{value}</span>
        {suffix ? <span className="text-13 text-text-secondary">{suffix}</span> : null}
      </span>
      <span className="truncate text-12 text-text-secondary">{note}</span>
    </div>
  );
}
