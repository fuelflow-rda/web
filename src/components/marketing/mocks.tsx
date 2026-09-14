import React, { useId } from 'react';

/**
 * Product mockups drawn in HTML and CSS, standing in where the reference layout
 * used photographs. Every figure is a plausible portal or app screen built from
 * the real product's vocabulary, so nothing here is stock imagery.
 *
 * Each figure is exposed to assistive technology as one image with a
 * description; the inner markup is decorative.
 */

function Figure({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure role="img" aria-label={label} className={className}>
      <div aria-hidden="true">{children}</div>
    </figure>
  );
}

/* Sales per hour by payment method, 06:00 to 18:00, in thousands of RWF. */
const PAYMENT_SERIES = [
  { key: 'momo', label: 'MoMo', color: 'var(--mk-pay-momo)', values: [120, 180, 260, 340, 310, 420, 480, 390, 450, 560, 520, 430, 380] },
  { key: 'cash', label: 'Cash', color: 'var(--mk-pay-cash)', values: [90, 140, 170, 210, 240, 230, 280, 260, 250, 300, 270, 240, 200] },
  { key: 'card', label: 'Card', color: 'var(--mk-pay-card)', values: [20, 30, 45, 60, 55, 80, 95, 70, 90, 120, 110, 95, 80] },
];

/**
 * Smooth line chart drawn as inline SVG. Each series becomes a Catmull-Rom curve
 * converted to cubic Beziers, with a faint area fill and an end-point marker.
 */
function LineChart({
  series,
  width = 400,
  height = 120,
}: {
  series: typeof PAYMENT_SERIES;
  width?: number;
  height?: number;
}) {
  // The mock is rendered several times per page; gradient ids must not collide.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pad = { top: 10, right: 14, bottom: 6, left: 6 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const max = Math.max(...series.flatMap((s) => s.values)) * 1.08;
  const n = series[0].values.length;
  const x = (i: number) => pad.left + (i / (n - 1)) * w;
  const y = (v: number) => pad.top + h - (v / max) * h;

  const curve = (values: number[]) => {
    const pts = values.map((v, i) => [x(i), y(v)] as const);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
    }
    return { d, last: pts[pts.length - 1] };
  };

  const gridYs = [0.25, 0.5, 0.75, 1].map((f) => pad.top + h - f * h);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mock-line" preserveAspectRatio="none" focusable="false">
      <defs>
        {series.map((s) => (
          <linearGradient key={s.key} id={`area-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={s.color} stopOpacity="0.18" />
            <stop offset="1" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {gridYs.map((gy) => (
        <line key={gy} x1={pad.left} x2={width - pad.right} y1={gy} y2={gy} className="mock-line-grid" />
      ))}
      {series.map((s) => {
        const { d, last } = curve(s.values);
        const area = `${d} L ${last[0]} ${pad.top + h} L ${x(0)} ${pad.top + h} Z`;
        return (
          <g key={s.key}>
            <path d={area} fill={`url(#area-${uid}-${s.key})`} />
            <path d={d} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <circle cx={last[0]} cy={last[1]} r="3.5" fill={s.color} stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </svg>
  );
}

function PaymentChart() {
  const totals = PAYMENT_SERIES.map((s) => ({ ...s, total: s.values.reduce((a, b) => a + b, 0) }));
  const sum = totals.reduce((a, s) => a + s.total, 0);
  return (
    <div className="mock-chart">
      <div className="mock-chart-head">
        <b>Sales by payment method</b>
        <span>06:00 to 18:00, RWF thousands</span>
      </div>
      <LineChart series={PAYMENT_SERIES} />
      <div className="mock-line-axis">
        <span>06:00</span>
        <span>09:00</span>
        <span>12:00</span>
        <span>15:00</span>
        <span>18:00</span>
      </div>
      <div className="mock-split" aria-hidden="true">
        {totals.map((s) => (
          <i key={s.key} style={{ width: `${(s.total / sum) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="mock-legend mock-legend-pay">
        {totals.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label} <b>{Math.round((s.total / sum) * 100)}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

export function OverviewMock({ className }: { className?: string }) {
  return (
    <Figure
      label="Manager dashboard for Kigali Central showing revenue, litres sold and active pumps for the day, a line chart of sales by payment method (mobile money, cash and card), a payment split bar, and pump status."
      className={className}
    >
      <div className="mock">
        <div className="mock-bar">
          <div>
            <b>Kigali Central</b>
            <br />
            <span>Live overview, today</span>
          </div>
          <span className="mock-pill">
            <i /> Live
          </span>
        </div>
        <div className="mock-body">
          <div className="mock-tiles">
            <div className="mock-tile">
              <small>Revenue</small>
              <b>RWF 4,812,300</b>
              <em>+6.2% vs yesterday</em>
            </div>
            <div className="mock-tile">
              <small>Volume</small>
              <b>3,146 L</b>
              <em>+4.1% vs yesterday</em>
            </div>
            <div className="mock-tile">
              <small>Pumps active</small>
              <b>7 of 8</b>
              <em>1 idle over 30 min</em>
            </div>
          </div>
          <PaymentChart />
          <div className="mock-list">
            <div className="mock-row">
              <b>Pump 3</b>
              <span>Diesel, last sale 2 min ago</span>
              <span className="mock-pill">
                <i /> Active
              </span>
            </div>
            <div className="mock-row">
              <b>Pump 6</b>
              <span>Gasoline, last sale 34 min ago</span>
              <span className="mock-pill is-idle">
                <i /> Idle
              </span>
            </div>
          </div>
        </div>
      </div>
    </Figure>
  );
}

export function PhoneMock({ className }: { className?: string }) {
  return (
    <Figure
      label="Attendant app new sale screen: product options gasoline, diesel and EV with diesel selected, amount RWF 20,000, payment options cash, mobile money and card with mobile money selected, and a large Save sale button."
      className={className}
    >
      <div className="mock-phone">
        <div className="mock-phone-screen">
          <div className="mock-phone-top">
            <span>Pump 3</span>
            <span>Shift 06:00</span>
          </div>
          <div className="mock-phone-title">New sale</div>
          <div className="mock-phone-label">Product</div>
          <div className="mock-phone-grid is-3">
            <div className="mock-phone-btn">Gasoline</div>
            <div className="mock-phone-btn is-on">Diesel</div>
            <div className="mock-phone-btn">EV</div>
          </div>
          <div className="mock-phone-label">Amount</div>
          <div className="mock-phone-amount">
            20,000<small>RWF</small>
          </div>
          <div className="mock-phone-label">Payment</div>
          <div className="mock-phone-grid is-3">
            <div className="mock-phone-btn">Cash</div>
            <div className="mock-phone-btn is-on">MoMo</div>
            <div className="mock-phone-btn">Card</div>
          </div>
          <div className="mock-phone-save">Save sale</div>
        </div>
      </div>
    </Figure>
  );
}

export function ReconciliationMock({ className }: { className?: string }) {
  return (
    <Figure
      label="Daily reconciliation table comparing expected and recorded revenue per pump, with one pump showing a shortfall of RWF 12,000."
      className={className}
    >
      <div className="mock">
        <div className="mock-bar">
          <div>
            <b>Reconciliation</b>
            <br />
            <span>Generated 00:00, Remera Station</span>
          </div>
          <span className="mock-pill is-off">
            <i /> 1 discrepancy
          </span>
        </div>
        <table className="mock-table">
          <thead>
            <tr>
              <th>Pump</th>
              <th className="is-num">Expected</th>
              <th className="is-num">Recorded</th>
              <th className="is-num">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pump 1</td>
              <td className="is-num">612,400</td>
              <td className="is-num">612,400</td>
              <td className="is-num is-good">0</td>
            </tr>
            <tr>
              <td>Pump 2</td>
              <td className="is-num">548,900</td>
              <td className="is-num">536,900</td>
              <td className="is-num is-bad">-12,000</td>
            </tr>
            <tr>
              <td>Pump 3</td>
              <td className="is-num">701,250</td>
              <td className="is-num">701,250</td>
              <td className="is-num is-good">0</td>
            </tr>
            <tr>
              <td>Charger A</td>
              <td className="is-num">96,000</td>
              <td className="is-num">96,000</td>
              <td className="is-num is-good">0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

export function ShiftMock({ className }: { className?: string }) {
  return (
    <Figure
      label="Shift summary card for an attendant: 41 sales, RWF 1,236,500 recorded, split between cash and mobile money, closed at 14:02."
      className={className}
    >
      <div className="mock">
        <div className="mock-bar">
          <div>
            <b>Shift summary</b>
            <br />
            <span>J. Mukamana, Pump 3</span>
          </div>
          <span className="mock-pill">
            <i /> Closed 14:02
          </span>
        </div>
        <div className="mock-body">
          <ul className="mock-kv">
            <li>
              <span>Sales recorded</span>
              <b>41</b>
            </li>
            <li>
              <span>Total</span>
              <b>RWF 1,236,500</b>
            </li>
            <li>
              <span>Cash</span>
              <b>RWF 418,000</b>
            </li>
            <li>
              <span>Mobile money</span>
              <b>RWF 818,500</b>
            </li>
            <li>
              <span>Duration</span>
              <b className="is-good">8 h 02 min</b>
            </li>
          </ul>
        </div>
      </div>
    </Figure>
  );
}

export function PricesMock({ className }: { className?: string }) {
  return (
    <Figure
      label="Fuel price and EV tariff list for one station: gasoline and diesel per litre, and three EV charging tiers per kilowatt hour."
      className={className}
    >
      <div className="mock">
        <div className="mock-bar">
          <div>
            <b>Prices</b>
            <br />
            <span>Kigali Central, in force since 1 Sep</span>
          </div>
        </div>
        <div className="mock-body" style={{ display: 'grid', gap: 8 }}>
          <div className="mock-price">
            <i style={{ background: 'var(--mk-gasoline)' }} />
            <div>
              <b>Gasoline</b>
              <small>per litre</small>
            </div>
            <em>RWF 1,690</em>
          </div>
          <div className="mock-price">
            <i style={{ background: 'var(--mk-diesel)' }} />
            <div>
              <b>Diesel</b>
              <small>per litre</small>
            </div>
            <em>RWF 1,640</em>
          </div>
          <div className="mock-price">
            <i style={{ background: '#456b58' }} />
            <div>
              <b>EV AC</b>
              <small>per kWh</small>
            </div>
            <em>RWF 320</em>
          </div>
          <div className="mock-price">
            <i style={{ background: '#286457' }} />
            <div>
              <b>EV DC fast</b>
              <small>per kWh</small>
            </div>
            <em>RWF 450</em>
          </div>
          <div className="mock-price">
            <i style={{ background: '#14524a' }} />
            <div>
              <b>EV DC ultra-fast</b>
              <small>per kWh</small>
            </div>
            <em>RWF 560</em>
          </div>
        </div>
      </div>
    </Figure>
  );
}

export function TransactionsMock({ className }: { className?: string }) {
  return (
    <Figure
      label="Live transaction feed listing the latest sales with pump, product, attendant, amount and payment method."
      className={className}
    >
      <div className="mock">
        <div className="mock-bar">
          <div>
            <b>Transactions</b>
            <br />
            <span>Streaming, newest first</span>
          </div>
          <span className="mock-pill">
            <i /> Live
          </span>
        </div>
        <table className="mock-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Pump</th>
              <th>Product</th>
              <th className="is-num">Amount</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>10:42</td>
              <td>3</td>
              <td>Diesel</td>
              <td className="is-num">20,000</td>
              <td>MoMo</td>
            </tr>
            <tr>
              <td>10:41</td>
              <td>1</td>
              <td>Gasoline</td>
              <td className="is-num">15,000</td>
              <td>Cash</td>
            </tr>
            <tr>
              <td>10:39</td>
              <td>A</td>
              <td>EV DC fast</td>
              <td className="is-num">18,450</td>
              <td>Card</td>
            </tr>
            <tr>
              <td>10:38</td>
              <td>5</td>
              <td>Diesel</td>
              <td className="is-num">50,000</td>
              <td>MoMo</td>
            </tr>
            <tr>
              <td>10:36</td>
              <td>2</td>
              <td>Gasoline</td>
              <td className="is-num">10,000</td>
              <td>Cash</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

export function CompanyMock({ className }: { className?: string }) {
  return (
    <Figure
      label="Company overview comparing four stations by revenue and volume for the month, with Kigali Central leading."
      className={className}
    >
      <div className="mock">
        <div className="mock-bar">
          <div>
            <b>Company overview</b>
            <br />
            <span>4 stations, September</span>
          </div>
        </div>
        <table className="mock-table">
          <thead>
            <tr>
              <th>Station</th>
              <th className="is-num">Revenue</th>
              <th className="is-num">Volume</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Kigali Central</td>
              <td className="is-num">61.4 M</td>
              <td className="is-num">38,900 L</td>
              <td>
                <span className="mock-pill">
                  <i /> Open
                </span>
              </td>
            </tr>
            <tr>
              <td>Remera Station</td>
              <td className="is-num">44.8 M</td>
              <td className="is-num">28,100 L</td>
              <td>
                <span className="mock-pill">
                  <i /> Open
                </span>
              </td>
            </tr>
            <tr>
              <td>Gikondo Main</td>
              <td className="is-num">39.2 M</td>
              <td className="is-num">25,400 L</td>
              <td>
                <span className="mock-pill is-idle">
                  <i /> 1 alert
                </span>
              </td>
            </tr>
            <tr>
              <td>Nyabugogo Depot</td>
              <td className="is-num">27.5 M</td>
              <td className="is-num">17,900 L</td>
              <td>
                <span className="mock-pill">
                  <i /> Open
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

/**
 * Compact versions sized for the 300 by 223 media box on the platform cards.
 * Same vocabulary as the full mocks, laid out to fit without cropping.
 */
export function PhoneThumb({ className }: { className?: string }) {
  return (
    <Figure
      label="Attendant app new sale screen, compact: product options gasoline, diesel and EV with diesel selected, amount RWF 20,000, payment options cash, mobile money and card, and a Save sale button."
      className={className}
    >
      <div className="thumb-screen mock-fit">
        <div className="thumb-top">
          <b>New sale</b>
          <span>Pump 3</span>
        </div>
        <div className="thumb-label">Product</div>
        <div className="thumb-row">
          <div className="thumb-btn">Gasoline</div>
          <div className="thumb-btn is-on">Diesel</div>
          <div className="thumb-btn">EV</div>
        </div>
        <div className="thumb-label">Amount</div>
        <div className="thumb-amount">
          20,000<small>RWF</small>
        </div>
        <div className="thumb-label">Payment</div>
        <div className="thumb-row">
          <div className="thumb-btn">Cash</div>
          <div className="thumb-btn is-on">MoMo</div>
          <div className="thumb-btn">Card</div>
        </div>
        <div className="thumb-save">Save sale</div>
      </div>
    </Figure>
  );
}

export function OverviewThumb({ className }: { className?: string }) {
  return (
    <Figure
      label="Compact manager dashboard: revenue RWF 4.81 million, 3,146 litres, 7 of 8 pumps active, and a line chart of sales by payment method."
      className={className}
    >
      <div className="thumb-dash mock-fit">
        <div className="thumb-dash-head">
          <div>
            <b>Kigali Central</b>
            <span>Live overview, today</span>
          </div>
          <span className="mock-pill">
            <i /> Live
          </span>
        </div>
        <div className="thumb-tiles">
          <div className="thumb-tile">
            <small>Revenue</small>
            <b>RWF 4.81 M</b>
            <em>+6.2%</em>
          </div>
          <div className="thumb-tile">
            <small>Volume</small>
            <b>3,146 L</b>
            <em>+4.1%</em>
          </div>
          <div className="thumb-tile">
            <small>Pumps</small>
            <b>7 of 8</b>
            <em>1 idle</em>
          </div>
        </div>
        <div className="thumb-chart">
          <LineChart series={PAYMENT_SERIES} height={90} />
          <div className="mock-legend mock-legend-pay">
            {PAYMENT_SERIES.map((p) => (
              <span key={p.key}>
                <i style={{ background: p.color }} />
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Figure>
  );
}
