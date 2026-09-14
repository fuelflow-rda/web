import React from 'react';

/**
 * Login hero artwork: a pump attendant working the nozzle at a dispenser, with a
 * car taking fuel and a delivery truck behind.
 *
 * Two classes of colour live here, and they behave differently by design.
 *
 * Anything that reads as a *material* — a white truck body, terracotta paint,
 * hi-vis amber, tyre rubber — is a fixed hex. Those objects look the same under
 * either theme for the same reason a photograph would, and swapping them for
 * ink/surface tokens would turn the scene into a silhouette.
 *
 * Anything that reads as *stage* — the backdrop disc, the floating cards, the
 * ground shadow — is drawn from theme tokens so it follows light and dark. That
 * is what keeps the artwork sitting on the panel instead of on top of it.
 *
 * The greens are deliberately mid-range rather than the deep `--accent`: they
 * have to hold up against a cream panel and a near-black one.
 */
const PAINT = {
  green900: '#2B5A4E',
  green700: '#3C7A69',
  green500: '#58A08B',
  green300: '#9CC7B8',
  cream: '#F4F6F5',
  creamShade: '#DCE2E0',
  clay: '#C4705E',
  clayShade: '#A85B4B',
  amber: '#DDA94E',
  amberShade: '#C08F3A',
  skin: '#C99065',
  skinShade: '#A9744E',
  steel: '#6B757C',
  steelShade: '#4C555B',
  tyre: '#2B3033',
  glass: '#9FC4D6',
  ink: '#1F262B',
};

export function ForecourtIllustration({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 560 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="A pump attendant fuelling a car at a service station, with a delivery truck behind."
    >
      <defs>
        <linearGradient id="ff-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAINT.skin} />
          <stop offset="1" stopColor={PAINT.skinShade} />
        </linearGradient>
        <linearGradient id="ff-vest" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={PAINT.amber} />
          <stop offset="1" stopColor={PAINT.amberShade} />
        </linearGradient>
        <linearGradient id="ff-suit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={PAINT.green700} />
          <stop offset="1" stopColor={PAINT.green900} />
        </linearGradient>
        <linearGradient id="ff-car" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={PAINT.clay} />
          <stop offset="1" stopColor={PAINT.clayShade} />
        </linearGradient>
        <linearGradient id="ff-truck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={PAINT.creamShade} />
        </linearGradient>
        <linearGradient id="ff-pump" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={PAINT.green700} />
          <stop offset="1" stopColor={PAINT.green900} />
        </linearGradient>
        <linearGradient id="ff-orb" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={PAINT.green500} />
          <stop offset="1" stopColor={PAINT.green900} />
        </linearGradient>
        <linearGradient id="ff-orb-soft" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={PAINT.green300} />
          <stop offset="1" stopColor={PAINT.green500} />
        </linearGradient>
      </defs>

      {/* ---- Stage: backdrop disc and scattered motes ---- */}
      <circle cx="280" cy="206" r="184" fill="var(--accent)" opacity="0.09" />
      <circle cx="280" cy="206" r="128" fill="var(--accent)" opacity="0.06" />

      <g fill="var(--accent)" opacity="0.35">
        <circle cx="104" cy="72" r="3.5" />
        <circle cx="176" cy="38" r="2.5" />
        <circle cx="366" cy="52" r="3" />
        <circle cx="486" cy="188" r="3.5" />
        <circle cx="60" cy="232" r="3" />
        <circle cx="512" cy="336" r="2.5" />
        <circle cx="146" cy="356" r="2.5" />
        <circle cx="430" cy="30" r="2.5" />
      </g>

      <g stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" opacity="0.3">
        <path d="M128 96l24-15" />
        <path d="M470 118l20-13" />
        <path d="M78 178l17-11" />
        <path d="M410 286l16-10" />
      </g>

      <circle cx="92" cy="116" r="25" fill="url(#ff-orb-soft)" opacity="0.5" />
      <circle cx="474" cy="86" r="15" fill="url(#ff-orb)" opacity="0.45" />
      <circle cx="508" cy="252" r="10" fill="url(#ff-orb-soft)" opacity="0.6" />
      <circle cx="52" cy="300" r="13" fill="url(#ff-orb)" opacity="0.35" />

      {/* ---- Floating cards, flanking the attendant's head ---- */}
      <g>
        <rect
          x="84"
          y="166"
          width="80"
          height="48"
          rx="14"
          fill="var(--surface)"
          stroke="var(--line)"
        />
        {/* Fuel droplet */}
        <path d="M106 180c6 7 9 11 9 15a9 9 0 01-18 0c0-4 3-8 9-15z" fill={PAINT.green500} />
        <rect x="122" y="183" width="28" height="5" rx="2.5" fill="var(--line-strong)" />
        <rect x="122" y="193" width="18" height="5" rx="2.5" fill="var(--line)" />
      </g>

      <g>
        <rect
          x="398"
          y="148"
          width="86"
          height="56"
          rx="14"
          fill="var(--surface)"
          stroke="var(--line)"
        />
        {/* Mini volume chart */}
        <rect x="412" y="178" width="10" height="14" rx="3" fill={PAINT.green300} />
        <rect x="428" y="170" width="10" height="22" rx="3" fill={PAINT.green500} />
        <rect x="444" y="162" width="10" height="30" rx="3" fill={PAINT.green700} />
        <rect x="460" y="172" width="10" height="20" rx="3" fill={PAINT.green500} />
      </g>

      {/* ---- Delivery truck, set back on the left ---- */}
      <g>
        <ellipse cx="90" cy="324" rx="80" ry="8" fill="var(--ink)" opacity="0.07" />
        <rect x="22" y="244" width="96" height="62" rx="7" fill="url(#ff-truck)" />
        <rect x="22" y="278" width="96" height="9" fill={PAINT.green500} />
        <rect x="33" y="255" width="30" height="6" rx="3" fill={PAINT.creamShade} />
        <path d="M118 306v-50h20l16 20h4v30z" fill={PAINT.green900} />
        <path d="M133 261h4l12 15h-16z" fill={PAINT.glass} />
        <circle cx="50" cy="308" r="11" fill={PAINT.tyre} />
        <circle cx="50" cy="308" r="4.5" fill={PAINT.steel} />
        <circle cx="138" cy="308" r="11" fill={PAINT.tyre} />
        <circle cx="138" cy="308" r="4.5" fill={PAINT.steel} />
      </g>

      {/* ---- Car at the pump ---- */}
      <g>
        <ellipse cx="434" cy="360" rx="110" ry="11" fill="var(--ink)" opacity="0.08" />
        <path
          d="M330 340v-20c0-7 5-11 12-12l62-6 26-21c4-4 9-6 14-6h36c7 0 13 3 17 8l19 23 14 5c6 2 8 7 8 13v16z"
          fill="url(#ff-car)"
        />
        <path d="M406 273h-24c-3 0-6 1-8 4l-11 16h43z" fill={PAINT.glass} />
        <path d="M436 293l-11-17c-2-3-4-4-7-4h-7v21z" fill={PAINT.glass} />
        <path d="M342 336h186" stroke={PAINT.clayShade} strokeWidth="2" opacity="0.5" />
        <rect x="330" y="316" width="8" height="9" rx="3" fill={PAINT.amber} opacity="0.75" />
        <rect x="529" y="316" width="9" height="9" rx="3" fill={PAINT.cream} />
        <circle cx="366" cy="312" r="6" fill={PAINT.steelShade} />
        <circle cx="372" cy="340" r="18" fill={PAINT.tyre} />
        <circle cx="372" cy="340" r="7.5" fill={PAINT.steel} />
        <circle cx="498" cy="340" r="18" fill={PAINT.tyre} />
        <circle cx="498" cy="340" r="7.5" fill={PAINT.steel} />
      </g>

      {/* ---- Dispenser ---- */}
      <g>
        <rect x="166" y="356" width="72" height="13" rx="5" fill={PAINT.steelShade} />
        <rect x="178" y="221" width="48" height="14" rx="6" fill={PAINT.green500} />
        <rect x="182" y="233" width="40" height="124" rx="8" fill="url(#ff-pump)" />
        <rect x="190" y="246" width="24" height="30" rx="5" fill={PAINT.ink} />
        <rect x="195" y="253" width="14" height="4" rx="2" fill={PAINT.green500} />
        <rect x="195" y="262" width="9" height="4" rx="2" fill={PAINT.amber} />
        <rect x="190" y="288" width="24" height="7" rx="3.5" fill={PAINT.green500} opacity="0.6" />
        <rect x="190" y="303" width="16" height="5" rx="2.5" fill={PAINT.green500} opacity="0.4" />
      </g>

      {/* Hose, dispenser to nozzle */}
      <path
        d="M224 300c26 40 62 44 92 20"
        stroke={PAINT.green900}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* ---- Attendant ---- */}
      <g>
        <ellipse cx="277" cy="380" rx="46" ry="8" fill="var(--ink)" opacity="0.1" />

        {/* Legs and boots */}
        <rect x="255" y="314" width="19" height="58" rx="9" fill={PAINT.green900} />
        <rect x="280" y="314" width="19" height="58" rx="9" fill={PAINT.green900} />
        <rect x="246" y="365" width="30" height="14" rx="7" fill={PAINT.ink} />
        <rect x="278" y="365" width="31" height="14" rx="7" fill={PAINT.ink} />

        {/* Arms, drawn before the torso so the shoulders cap them */}
        <path
          d="M300 272q24 14 32 40"
          stroke="url(#ff-suit)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M254 272q-9 20-6 40"
          stroke="url(#ff-suit)"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Coverall */}
        <path
          d="M248 274c0-12 9-21 21-22h16c12 1 21 10 21 22v42c0 7-5 12-12 12h-34c-7 0-12-5-12-12z"
          fill="url(#ff-suit)"
        />
        {/* Hi-vis vest */}
        <path d="M256 262h42v54c0 4-3 7-7 7h-28c-4 0-7-3-7-7z" fill="url(#ff-vest)" />
        <rect x="256" y="286" width="42" height="7" fill={PAINT.cream} opacity="0.9" />
        <rect x="256" y="300" width="42" height="5" fill={PAINT.cream} opacity="0.65" />
        <rect x="275" y="262" width="3" height="61" fill={PAINT.amberShade} opacity="0.7" />

        {/* Head */}
        <rect x="270" y="242" width="14" height="14" rx="5" fill={PAINT.skinShade} />
        <circle cx="277" cy="226" r="25" fill="url(#ff-skin)" />
        <circle cx="252" cy="230" r="5" fill={PAINT.skinShade} />
        <circle cx="264" cy="234" r="4.5" fill={PAINT.clay} opacity="0.28" />
        <circle cx="291" cy="234" r="4.5" fill={PAINT.clay} opacity="0.28" />
        <circle cx="270" cy="225" r="2.8" fill={PAINT.ink} />
        <circle cx="287" cy="225" r="2.8" fill={PAINT.ink} />
        <path
          d="M270 236q7 6 14 0"
          stroke={PAINT.ink}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Cap */}
        <path d="M253 220a24 24 0 0148 0z" fill={PAINT.green900} />
        <path d="M299 214h17c4 0 7 3 7 6s-3 6-7 6h-17z" fill={PAINT.green700} />
        <circle cx="277" cy="198" r="3.5" fill={PAINT.green500} />

        {/* Nozzle: spout runs into the filler at (366, 312), clear of the wheel. */}
        <rect x="322" y="304" width="30" height="16" rx="8" fill={PAINT.cream} />
        <rect x="350" y="309" width="18" height="6" rx="3" fill={PAINT.steel} />
        <rect x="330" y="318" width="10" height="8" rx="3" fill={PAINT.steelShade} />
        <circle cx="334" cy="312" r="9" fill="url(#ff-skin)" />
        <circle cx="248" cy="314" r="9" fill="url(#ff-skin)" />
      </g>

      {/* ---- Foliage at the base ---- */}
      <g>
        <path
          d="M132 372c-16-8-24-26-21-42 13 5 23 22 21 42z"
          fill={PAINT.green700}
        />
        <path
          d="M134 372c4-16 18-28 33-29-2 16-16 28-33 29z"
          fill={PAINT.green500}
        />
        <path d="M120 372c-10-6-15-18-13-28 9 4 15 16 13 28z" fill={PAINT.green900} />
        <path
          d="M508 366c14-7 21-23 18-37-11 4-20 20-18 37z"
          fill={PAINT.green700}
        />
        <path
          d="M506 366c-4-14-16-24-29-25 2 14 14 24 29 25z"
          fill={PAINT.green500}
        />
        <path d="M527 366c9-5 13-16 11-25-8 4-13 15-11 25z" fill={PAINT.green300} />
      </g>
    </svg>
  );
}
