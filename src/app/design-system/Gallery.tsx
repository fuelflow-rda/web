'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Banknote, Bell, ChevronDown, CloudOff, Download, LayoutDashboard, Plus, Search, Settings, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Avatar,
  Banner,
  Button,
  Checkbox,
  IconButton,
  KpiTile,
  NavItem,
  PageHeader,
  Panel,
  Segmented,
  StatusChip,
  Tabs,
  Tag,
  TextField,
  Toggle,
} from '@/components/ui';
import { fixedColors, radius, textStyles, themedColors } from '@/theme/tokens';

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8" data-section={title}>
      <div className="flex flex-col gap-1">
        <h2 className="m-0 type-h2 text-text">{title}</h2>
        {note ? <p className="m-0 max-w-[60ch] text-14 text-text-secondary">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

const Row = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

export function Gallery() {
  const [range, setRange] = useState<string | number>('Today');
  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-10 px-8 py-10">
      <PageHeader
        title="Design system"
        description="Base components built from design-tokens/tokens.json. Compare with the Components board in Relay design/relay.pen."
        actions={<ThemeToggle />}
      />

      <Section title="Buttons" note="One primary per view. Secondary is outlined, ghost is text only, danger is a tint for irreversible actions.">
        <Row>
          <Button kind="primary" icon={Plus}>Start shift</Button>
          <Button kind="secondary" icon={Download}>Export CSV</Button>
          <Button kind="ghost">Cancel</Button>
          <Button kind="danger">Void sale</Button>
          <IconButton icon={Bell} label="Notifications" />
        </Row>
        <Row>
          <Button kind="primary" size="lg" icon={Plus}>Start shift</Button>
          <Button kind="secondary" size="lg">Export CSV</Button>
          <Button kind="ghost" size="lg">Cancel</Button>
          <Button kind="danger" size="lg">Void sale</Button>
        </Row>
        <Row>
          <Button kind="primary" disabled>Disabled</Button>
          <Button kind="primary" loading>Saving</Button>
        </Row>
      </Section>

      <Section title="Status and tags" note="Status pairs colour with an icon and a word. Product and payment tags carry colour in the dot only.">
        <Row>
          <StatusChip tone="success">Synced</StatusChip>
          <StatusChip tone="warning">Pending</StatusChip>
          <StatusChip tone="danger">Review</StatusChip>
          <StatusChip tone="info">Scheduled</StatusChip>
          <StatusChip tone="neutral">Offline</StatusChip>
        </Row>
        <Row>
          <Tag color="var(--product-gasoline)">Gas</Tag>
          <Tag color="var(--product-diesel)">Diesel</Tag>
          <Tag color="var(--product-ev-ac)">EV AC</Tag>
          <Tag color="var(--product-ev-dc)">EV DC</Tag>
          <Tag color="var(--product-ev-ultra)">Ultra</Tag>
          <Tag color="var(--pay-cash)">Cash</Tag>
          <Tag color="var(--pay-card)">Card</Tag>
          <Tag color="var(--pay-momo)">MoMo</Tag>
          <Avatar name="Aline Uwase" />
        </Row>
      </Section>

      <Section title="Inputs" note="Label above, value inside, hint below. Focus is a 2px jade border; errors use the danger colour and explain the fix.">
        <div className="grid max-w-[960px] grid-cols-3 gap-6">
          <TextField label="Phone number" hint="Used to sign in on the attendant app" defaultValue="078 811 1111" leadingIcon={Search} trailingIcon={ChevronDown} />
          <TextField label="Phone number" hint="Used to sign in on the attendant app" defaultValue="078 811 11" leadingIcon={Search} trailingIcon={ChevronDown} autoFocus />
          <TextField label="Phone number" error="Enter 10 digits, starting with 07" defaultValue="078 81" leadingIcon={Search} trailingIcon={ChevronDown} />
        </div>
        <Row>
          <Checkbox defaultChecked>Remember this device for 7 days</Checkbox>
          <Toggle label="Email me the daily reconciliation" defaultChecked />
        </Row>
        <Row>
          <Segmented options={['Today', '7 days', '30 days', '90 days']} value={range} onChange={setRange} />
        </Row>
        <Tabs
          items={[
            { key: 'pump', label: 'By pump' },
            { key: 'attendant', label: 'By attendant' },
            { key: 'payment', label: 'By payment' },
          ]}
        />
      </Section>

      <Section title="Data display" note="KPI tiles lead a dashboard. Panels hold a chart, list or table. Banners report system state.">
        <div className="grid grid-cols-3 gap-4">
          <KpiTile label="Revenue today" value="1,284,500" prefix="RWF" icon={Banknote} delta={{ text: '8.2% vs yesterday', direction: 'up', good: true }} />
          <KpiTile label="Fuel dispensed" value="786.4" suffix="L" delta={{ text: '2.1% vs yesterday', direction: 'down', good: false }} />
          <KpiTile label="Variance" value="0.0" suffix="L" delta={{ text: 'Matched', direction: 'flat' }} />
        </div>
        <Panel title="Revenue by hour" meta="Times in Africa/Kigali" action={{ label: 'View all', href: '/design-system' }}>
          <p className="m-0 text-13 text-text-muted">Panel content</p>
        </Panel>
        <div className="grid max-w-[1060px] grid-cols-2 gap-3">
          <Banner tone="warning" title="1 sale waiting to sync" icon={CloudOff} action={{ label: 'Sync now', onClick: () => undefined }}>
            It is saved on this phone and will send when the internet is back.
          </Banner>
          <Banner tone="info" title="Prices change at midnight">New prices take effect on every pump at 00:00.</Banner>
          <Banner tone="danger" title="Reconciliation failed">Pump 2 reported no closing reading.</Banner>
          <Banner tone="success" title="Shift closed">42 sales, all synced.</Banner>
        </div>
      </Section>

      <Section title="Navigation" note="The sidebar is Night in both themes. One selected item, marked by the champagne bar.">
        <nav aria-label="Example sidebar" className="flex w-[272px] flex-col gap-1 rounded-card bg-sidebar-bg p-4">
          <NavItem href="/design-system" label="Overview" icon={LayoutDashboard} active />
          <NavItem href="/design-system#people" label="Attendants" icon={Users} count={3} />
          <NavItem href="/design-system#settings" label="Settings" icon={Settings} />
        </nav>
      </Section>

      <Section title="Type" note="The Typography board's named styles (web scale).">
        <div className="flex flex-col gap-3">
          {Object.entries(textStyles).map(([name, s]) => (
            <div key={name} className="flex items-baseline gap-6">
              <code className="w-24 shrink-0 font-mono text-12 text-text-muted">{name}</code>
              <span className={`type-${name} text-text`}>{s.family === 'mono' ? '1,284,500' : 'Every litre, accounted for'}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Colour" note="Themed tokens switch with the theme; fixed tokens are the same in both.">
        <div className="grid grid-cols-6 gap-3">
          {[...Object.keys(themedColors.light), ...Object.keys(fixedColors)].map((name) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div className="h-10 rounded-control border border-border" style={{ background: `var(--${name})` }} />
              <code className="font-mono text-11 text-text-secondary">{name}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius">
        <Row>
          {Object.entries(radius)
            .filter(([k]) => !k.startsWith('r'))
            .map(([name, r]) => (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <div className="size-14 border border-border-strong bg-surface-muted" style={{ borderRadius: `var(--radius-${name})` }} />
                <code className="font-mono text-11 text-text-secondary">
                  {name} {r === 9999 ? '' : r}
                </code>
              </div>
            ))}
        </Row>
      </Section>
    </main>
  );
}
