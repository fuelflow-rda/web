import QRCode from 'qrcode';
import { Building2, CreditCard, Ticket, type LucideIcon } from 'lucide-react';

/**
 * The landing page's membership cards and vouchers: what customers, cards and
 * vouchers do, and a picture of a printed voucher and a card applied at the
 * pump. The picture is sample data; the QR code is real and scans as the
 * voucher code printed under it, in the format the dashboard prints.
 */

const POINTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Building2,
    title: 'Customer accounts',
    text: 'Companies and individuals hold a prepaid balance at your stations. Top up by bank, MoMo or cash, send statements, and get an alert when a balance runs low.',
  },
  {
    icon: CreditCard,
    title: 'Membership cards',
    text: 'Each card has its own QR code and can be tied to one vehicle plate, with daily and monthly spending limits. Set a discount per litre or kilowatt hour for each product. The phone keeps the card list, so discounts still apply when the internet is down.',
  },
  {
    icon: Ticket,
    title: 'Vouchers',
    text: 'Create batches of prepaid or promotional vouchers with an expiry date and print them as sheets of QR codes. Each code works once. When a balance or a voucher does not cover the sale, the rest is paid in cash or MoMo.',
  },
];

export function CardsAndVouchersPoints() {
  return (
    <ul className="m-0 flex list-none flex-col gap-8 p-0">
      {POINTS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-5">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-control-lg bg-surface text-text">
            <Icon size={20} aria-hidden />
          </span>
          <span className="flex flex-col gap-2">
            <h3 className="m-0 text-22 font-semibold tracking-n10">{title}</h3>
            <p className="m-0 text-16 leading-[1.55] text-text-secondary">{text}</p>
          </span>
        </li>
      ))}
    </ul>
  );
}

const VOUCHER_CODE = 'K8TQ-CG52';

export function CardsAndVouchersVisual() {
  return (
    <div
      role="img"
      aria-label="A prepaid fuel voucher for RWF 20,000 with its QR code, and a fleet card applied at the pump with its diesel discount and what is left of today's limit"
      className="flex flex-col gap-4 self-center"
    >
      <div aria-hidden className="flex flex-col rounded-16 border border-border bg-surface">
        <div className="flex flex-col gap-2 p-6">
          <span className="font-mono text-11 font-medium tracking-p80 text-accent-text uppercase">Fuel voucher · prepaid</span>
          <span className="font-mono text-40 leading-none font-semibold tracking-n20">RWF 20,000</span>
          <span className="font-mono text-12 text-text-muted">Valid until 31 Jan 2027</span>
        </div>
        <div className="flex items-center gap-5 border-x-0 border-t border-b-0 border-dashed border-border-strong p-6">
          <QrCode code={VOUCHER_CODE} className="size-28 shrink-0" />
          <span className="flex flex-col gap-1.5">
            <span className="font-mono text-11 tracking-p80 text-text-muted uppercase">Voucher code</span>
            <span className="font-mono text-22 font-semibold">{VOUCHER_CODE}</span>
            <span className="text-13 text-text-secondary">Scan at the pump. Works once.</span>
          </span>
        </div>
      </div>

      <div aria-hidden className="flex flex-col gap-3 rounded-16 border border-border bg-surface p-5">
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-control bg-primary text-on-primary">
              <CreditCard size={16} />
            </span>
            <span className="flex flex-col">
              <span className="text-14 font-semibold">Fleet card · J. Mugisha</span>
              <span className="font-mono text-12 text-text-muted">RAD 410 F</span>
            </span>
          </span>
          <span className="rounded-chip bg-success-tint px-2 py-0.5 text-12 font-medium text-success">Applied</span>
        </span>
        <span className="flex items-center justify-between gap-3 border-t border-border pt-3 text-13">
          <span className="text-text-secondary">Discount</span>
          <span className="font-mono font-semibold">RWF 50 off per litre of diesel</span>
        </span>
        <span className="flex items-center justify-between gap-3 text-13">
          <span className="text-text-secondary">Left today</span>
          <span className="font-mono font-semibold">RWF 1,350,000 of 1,500,000</span>
        </span>
      </div>
    </div>
  );
}

/** A QR code drawn as one SVG path, with a two-module quiet zone so phones find its edges. */
function QrCode({ code, className }: { code: string; className?: string }) {
  const { modules } = QRCode.create(code, { errorCorrectionLevel: 'M' });
  const n = modules.size;
  const quiet = 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules.get(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  return (
    <svg viewBox={`0 0 ${n + quiet * 2} ${n + quiet * 2}`} shapeRendering="crispEdges" className={className}>
      <path d={d} fill="currentColor" />
    </svg>
  );
}
