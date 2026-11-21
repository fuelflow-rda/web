import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell, CloudOff, Fuel, LayoutDashboard, Search } from 'lucide-react';
import {
  Avatar,
  Banner,
  Button,
  Checkbox,
  IconButton,
  initialsOf,
  KpiTile,
  NavItem,
  PageHeader,
  Panel,
  StatusChip,
  Tag,
  TextField,
  Toggle,
} from './index';

describe('TextField', () => {
  it('names the input with its visible label and describes it with the hint', () => {
    render(<TextField label="Phone number" hint="Used to sign in on the attendant app" leadingIcon={Search} />);
    const input = screen.getByLabelText('Phone number');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveProperty('ariaInvalid', null);
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Used to sign in on the attendant app');
  });

  it('marks an error as invalid, announces it in place of the hint, and shows it in the danger colour', () => {
    render(<TextField label="Phone number" hint="Ten digits" error="Enter 10 digits, starting with 07" />);
    const input = screen.getByLabelText('Phone number');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const note = document.getElementById(input.getAttribute('aria-describedby')!)!;
    expect(note.textContent).toBe('Enter 10 digits, starting with 07');
    expect(note.className).toContain('text-danger');
    expect(screen.queryByText('Ten digits')).toBeNull();
  });

  it('keeps two fields with the same label apart', () => {
    render(
      <>
        <TextField label="Name" />
        <TextField label="Name" />
      </>,
    );
    const [a, b] = screen.getAllByLabelText('Name');
    expect(a.id).not.toBe(b.id);
  });
});

describe('Toggle', () => {
  it('is a switch named by its label, and the label toggles it', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Email me the daily reconciliation" onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Email me the daily reconciliation' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    await userEvent.click(screen.getByText('Email me the daily reconciliation'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0]).toBe(true);
  });
});

describe('Checkbox', () => {
  it('is a checkbox named by its label', async () => {
    render(<Checkbox>Remember this device for 7 days</Checkbox>);
    const box = screen.getByRole('checkbox', { name: 'Remember this device for 7 days' });
    await userEvent.click(box);
    expect((box as HTMLInputElement).checked).toBe(true);
  });
});

describe('Button and IconButton', () => {
  it('a primary button is the filled antd primary, with its icon hidden from assistive tech', async () => {
    const onClick = vi.fn();
    render(
      <Button kind="primary" icon={Fuel} onClick={onClick}>
        Start shift
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Start shift' });
    expect(button.className).toContain('ant-btn-primary');
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('danger is the filled danger variant, not a solid red button', () => {
    render(<Button kind="danger">Void sale</Button>);
    const cls = screen.getByRole('button', { name: 'Void sale' }).className;
    expect(cls).toContain('ant-btn-color-dangerous');
    expect(cls).toContain('ant-btn-variant-filled');
  });

  it('an icon button takes its accessible name from the label', () => {
    render(<IconButton icon={Bell} label="Notifications" />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
  });
});

describe('StatusChip, Tag and Avatar', () => {
  it('a status chip shows a word, with its icon hidden', () => {
    render(<StatusChip tone="success">Synced</StatusChip>);
    const chip = screen.getByText('Synced');
    expect(chip.className).toContain('text-success');
    expect(chip.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('a tag colours only its dot', () => {
    render(<Tag color="var(--product-gasoline)">Gas</Tag>);
    const tag = screen.getByText('Gas');
    expect(tag.className).toContain('text-text');
    expect((tag.querySelector('[aria-hidden]') as HTMLElement).style.background).toBe('var(--product-gasoline)');
  });

  it('an avatar is announced by name, not by its initials', () => {
    render(<Avatar name="Aline Uwase" />);
    expect(screen.getByRole('img', { name: 'Aline Uwase' }).textContent).toBe('AU');
  });

  it.each([
    ['Aline Uwase', 'AU'],
    // First and last name, as the design draws them: Jean Paul Habimana is JH.
    ['  jean   paul habimana ', 'JH'],
    ['Claudine', 'C'],
    ['', ''],
  ])('initialsOf(%j) is %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});

describe('Banner', () => {
  it('announces danger at once and the other tones politely', () => {
    const { rerender } = render(<Banner tone="danger" title="Reconciliation failed" />);
    expect(screen.getByRole('alert').textContent).toContain('Reconciliation failed');
    rerender(<Banner tone="warning" title="1 sale waiting to sync" icon={CloudOff} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('1 sale waiting to sync');
  });

  it('runs its action', async () => {
    const onClick = vi.fn();
    render(<Banner tone="warning" title="1 sale waiting to sync" action={{ label: 'Sync now', onClick }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('NavItem, Panel, PageHeader and KpiTile', () => {
  it('marks the current page', () => {
    render(
      <nav>
        <NavItem href="/dashboard" label="Overview" icon={LayoutDashboard} active count={3} />
        <NavItem href="/transactions" label="Transactions" icon={LayoutDashboard} />
      </nav>,
    );
    expect(screen.getByRole('link', { name: /Overview/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Transactions' }).getAttribute('aria-current')).toBeNull();
  });

  it('a panel is a region named by its title, with its action as a link', () => {
    render(
      <Panel title="Revenue by hour" meta="Times in Africa/Kigali" action={{ label: 'View all', href: '/transactions' }}>
        content
      </Panel>,
    );
    expect(screen.getByRole('region', { name: 'Revenue by hour' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View all' }).getAttribute('href')).toBe('/transactions');
  });

  it('the page header title is the h1', () => {
    render(<PageHeader title="Overview" description="Kigali Central" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy();
  });

  it('colours a KPI change by whether it is good news, not by its direction', () => {
    const { rerender } = render(
      <KpiTile label="Variance" value="3.2" suffix="L" delta={{ text: '+3.2 L', direction: 'up', good: false }} />,
    );
    expect(screen.getByText('+3.2 L').parentElement!.className).toContain('text-danger');
    rerender(<KpiTile label="Revenue today" value="1,284,500" prefix="RWF" delta={{ text: '8.2% vs yesterday', direction: 'up', good: true }} />);
    expect(screen.getByText('8.2% vs yesterday').parentElement!.className).toContain('text-success');
  });

  it('a KPI tile with a link is one link, named by its content', () => {
    render(<KpiTile label="Revenue today" value="1,284,500" prefix="RWF" href="/transactions" />);
    expect(screen.getByRole('link').textContent).toContain('Revenue today');
  });
});
