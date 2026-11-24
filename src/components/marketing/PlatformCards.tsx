import type { ReactNode } from 'react';
import { Check, CircleCheck, CloudOff, FileDown, FileSpreadsheet, LayoutDashboard, Scale, Smartphone, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';

/**
 * The four platform cards (Pencil "Platform" rows). Each pairs a short
 * description with a small picture of the real screen; the pictures are sample
 * data and are described in words for assistive tech.
 */
export function PlatformCards() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-y-13.5">
      <Card
        icon={Smartphone}
        title="Attendant app for Android and iOS"
        text="Phone number and PIN sign-in. Sales queue on the device when the network drops and sync when it returns. Large buttons, sized for gloves and sunlight."
        picture="The sale screen with Pump 1 chosen, and a note that one sale is waiting to sync"
      >
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { name: 'Pump 1', meta: 'Gasoline', dot: 'bg-product-gasoline', on: true },
            { name: 'Pump 2', meta: 'Diesel', dot: 'bg-product-diesel', on: false },
            { name: 'Charger 1', meta: 'EV DC', dot: 'bg-product-ev-dc', on: false },
          ].map((p) => (
            <div
              key={p.name}
              className={cx('flex flex-col gap-2 rounded-12 bg-surface p-3', p.on ? 'border-2 border-primary' : 'border border-border')}
            >
              <span className="flex items-center justify-between">
                <span className={cx('size-2 rounded-full', p.dot)} />
                {p.on ? (
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span className="text-15 font-semibold">{p.name}</span>
              <span className="font-mono text-11 tracking-p50 text-text-muted uppercase">{p.meta}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 rounded-control bg-warning-tint px-4 py-3">
          <CloudOff size={16} className="mt-0.5 shrink-0 text-warning" />
          <span className="flex flex-col gap-0.5">
            <span className="text-14 font-semibold text-warning">1 sale waiting to sync</span>
            <span className="text-12 text-text-secondary">Saved on this phone. It sends when the internet is back.</span>
          </span>
        </div>
      </Card>

      <Card
        icon={LayoutDashboard}
        title="Live station overview"
        text="Revenue, volume, product mix and pump status for the current day, updated as sales are recorded. Recent transactions stream in without a refresh."
        picture="Two figures from the overview: revenue today and energy delivered"
      >
        <div className="grid grid-cols-2 gap-3">
          <Figure label="Revenue today" unit="RWF" value="1,284,500" note="142 sales so far" />
          <Figure label="Energy" value="214.0" suffix="kWh" note="9 charging sessions" />
        </div>
      </Card>

      <Card
        icon={Scale}
        title="Daily reconciliation"
        text="Expected revenue against recorded revenue, per pump and per attendant, generated every night. Discrepancies are listed first."
        picture="A reconciliation listing Pump 2 for review and two pumps matched"
      >
        <div className="flex flex-col gap-2.5">
          <Row label="Pump 2 · Diesel" value="−3.2 L · −RWF 5,168" bad />
          <Row label="Pump 1 · Gasoline" value="−0.4 L" />
          <Row label="Charger 1 · EV DC" value="0.0 kWh" />
        </div>
      </Card>

      <Card
        icon={FileDown}
        title="Reports and exports"
        text="Attendant, pump, station and company reports for any date range. Every table exports to PDF and Excel with the same figures the dashboard shows."
        picture="A report for Kigali Central with PDF and Excel export buttons"
      >
        <div className="flex flex-col gap-3">
          <span className="flex items-center justify-between gap-3">
            <span className="text-14 font-medium">Kigali Central · 1 to 19 November</span>
            <span className="font-mono text-13 text-text-muted">2,904 sales</span>
          </span>
          <span className="flex flex-wrap gap-2">
            <FakeButton icon={FileDown}>Export PDF</FakeButton>
            <FakeButton icon={FileSpreadsheet}>Export Excel</FakeButton>
          </span>
        </div>
      </Card>
    </div>
  );
}

function Card({ icon: Icon, title, text, picture, children }: { icon: LucideIcon; title: string; text: string; picture: string; children: ReactNode }) {
  return (
    <article className="flex flex-col gap-6 rounded-16 border border-border bg-surface p-6 lg:p-9">
      <span className="inline-flex size-11 items-center justify-center rounded-control-lg bg-surface-muted text-text">
        <Icon size={20} aria-hidden />
      </span>
      <div className="flex flex-col gap-3">
        <h3 className="m-0 text-22 font-semibold tracking-n10 lg:text-24">{title}</h3>
        <p className="m-0 text-16 leading-[1.55] text-text-secondary">{text}</p>
      </div>
      <div role="img" aria-label={picture} className="mt-auto flex flex-col gap-3 rounded-12 border border-border bg-bg p-4 lg:p-5">
        <div aria-hidden className="flex flex-col gap-3">
          {children}
        </div>
      </div>
    </article>
  );
}

function Figure({ label, value, unit, suffix, note }: { label: string; value: string; unit?: string; suffix?: string; note: string }) {
  return (
    <span className="flex flex-col gap-2 rounded-12 border border-border bg-surface p-4">
      <span className="font-mono text-11 font-medium tracking-p80 text-text-muted uppercase">{label}</span>
      <span className="flex items-baseline gap-1.5">
        {unit ? <span className="text-13 text-text-secondary">{unit}</span> : null}
        <span className="font-mono text-22 font-medium tracking-n15">{value}</span>
        {suffix ? <span className="text-13 text-text-secondary">{suffix}</span> : null}
      </span>
      <span className="text-12 text-text-secondary">{note}</span>
    </span>
  );
}

function Row({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex-1 text-14 font-medium">{label}</span>
      <span className={cx('font-mono text-13 font-semibold', bad ? 'text-danger' : 'text-text-secondary')}>{value}</span>
      <span
        className={cx(
          'inline-flex items-center gap-1 rounded-chip px-2 py-0.5 text-12 font-medium',
          bad ? 'bg-danger-tint text-danger' : 'bg-success-tint text-success',
        )}
      >
        {bad ? <TriangleAlert size={12} /> : <CircleCheck size={12} />}
        {bad ? 'Review' : 'Matched'}
      </span>
    </span>
  );
}

/** Looks like the dashboard's export button; it is part of a picture, not a control. */
function FakeButton({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-control border border-border-strong bg-surface px-4 py-2 text-14 font-medium">
      <Icon size={16} />
      {children}
    </span>
  );
}
