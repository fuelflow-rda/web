import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StockEntry, StockLevel } from './data';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: vi.fn() },
}));

const {
  checkCount,
  checkDelivery,
  checkReason,
  costPerUnit,
  formatCostPerUnit,
  getEntries,
  getLevels,
  levelQty,
  parseCost,
  parseQuantity,
  recordCount,
  recordDelivery,
  removeEntry,
  signedQty,
  stockSubline,
} = await import('./data');
const { CountDrawer, DeliveryDrawer, EntriesTable, LevelCard, RemoveEntryDrawer } = await import('./views');

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

const level = (over: Partial<StockLevel> = {}): StockLevel => ({
  product: 'GASOLINE',
  unit: 'L',
  level: 12345.6,
  counted_at: '2026-11-23T06:00:00Z',
  counted_quantity: 15000,
  delivered_since_count: 3000,
  sold_since_count: 5654.4,
  last_delivery: { id: 'd1', occurred_at: '2026-11-24T08:15:00Z', quantity: 3000, supplier: 'Kivu Fuels' },
  ...over,
});
const uncounted = (over: Partial<StockLevel> = {}) =>
  level({ level: null, counted_at: null, counted_quantity: null, delivered_since_count: null, sold_since_count: null, ...over });
const entry = (over: Partial<StockEntry> = {}): StockEntry => ({
  id: 'e1',
  station_id: 's1',
  product: 'DIESEL',
  kind: 'delivery',
  quantity: 8000,
  unit: 'L',
  occurred_at: '2026-11-24T08:15:00Z',
  supplier: 'Kivu Fuels',
  reference: 'DN-4471',
  cost_rwf: 9600000,
  note: null,
  recorded_by: { id: 'u1', name: 'Claudine Mukamana' },
  created_at: '2026-11-24T08:20:00Z',
  ...over,
});

describe('cost per unit', () => {
  it('divides the total cost by the quantity', () => {
    expect(costPerUnit(9_600_000, 8000)).toBe(1200);
    expect(costPerUnit(0, 500)).toBe(0);
    expect(formatCostPerUnit(9_600_000, 8000, 'L')).toBe('RWF 1,200 per litre');
    expect(formatCostPerUnit(1_234_567, 1000, 'L')).toBe('RWF 1,234.57 per litre');
    expect(formatCostPerUnit(2_455_000, 10_000, 'KWH')).toBe('RWF 245.5 per kWh');
  });

  it('gives nothing when it cannot be worked out', () => {
    expect(costPerUnit(null, 8000)).toBeNull();
    expect(costPerUnit(9_600_000, null)).toBeNull();
    expect(costPerUnit(9_600_000, 0)).toBeNull();
    expect(costPerUnit(Number.NaN, 8000)).toBeNull();
    expect(costPerUnit(9_600_000, Number.NaN)).toBeNull();
    expect(formatCostPerUnit(undefined, 8000, 'L')).toBeNull();
  });
});

describe('stock wording', () => {
  it('signs changes and levels below zero', () => {
    expect(signedQty(3000, 'L')).toBe('+3,000.0 L');
    expect(signedQty(-5654.4, 'L')).toBe('−5,654.4 L');
    expect(signedQty(0, 'KWH')).toBe('0.0 kWh');
    expect(levelQty(-120, 'L')).toBe('−120.0 L');
    expect(levelQty(120, 'L')).toBe('120.0 L');
  });

  it('says electricity is for EV charging', () => {
    expect(stockSubline('GASOLINE')).toBe('In litres');
    expect(stockSubline('ELECTRICITY')).toBe('In kWh, for EV charging');
  });
});

describe('form checks', () => {
  const NOW = Date.parse('2026-11-25T10:00:00Z'); // 12:00 in Kigali
  const delivery = {
    product: 'DIESEL' as const,
    quantity: '8,000',
    wall: '2026-11-25T08:30',
    supplier: '',
    reference: ' DN-4471 ',
    cost: '9,600,000',
    note: '',
  };

  it('reads quantities and costs as typed, refusing what is not a number', () => {
    expect(parseQuantity('8,000')).toBe(8000);
    expect(parseQuantity('8000.5')).toBe(8000.5);
    expect(parseQuantity(' ')).toBeNull();
    expect(parseQuantity('8 tonnes')).toBeNaN();
    expect(parseCost('9,600,000')).toBe(9600000);
    expect(parseCost('')).toBeNull();
    // Decimals are refused, not dropped: 1,200.50 must never become 120,050.
    expect(parseCost('1,200.50')).toBeNaN();
  });

  it('builds a delivery in Kigali time, leaving out what was not filled in', () => {
    const { problems, body } = checkDelivery('s1', delivery, NOW);
    expect(problems).toEqual({});
    expect(body).toEqual({
      station_id: 's1',
      product: 'DIESEL',
      quantity: 8000,
      occurred_at: '2026-11-25T06:30:00.000Z',
      reference: 'DN-4471',
      cost_rwf: 9600000,
    });
  });

  it('refuses a delivery the API would refuse', () => {
    expect(checkDelivery('s1', { ...delivery, quantity: '' }, NOW).problems.quantity).toBe('Enter how many litres arrived.');
    expect(checkDelivery('s1', { ...delivery, product: 'ELECTRICITY', quantity: '' }, NOW).problems.quantity).toBe(
      'Enter how many kWh were bought.',
    );
    expect(checkDelivery('s1', { ...delivery, quantity: '0' }, NOW).problems.quantity).toBe('Enter a quantity above 0.');
    expect(checkDelivery('s1', { ...delivery, quantity: '1,000,000' }, NOW).problems).toEqual({});
    expect(checkDelivery('s1', { ...delivery, quantity: '1,000,001' }, NOW).problems.quantity).toMatch(/at most 1,000,000 L/);
    expect(checkDelivery('s1', { ...delivery, cost: '1200.5' }, NOW).problems.cost).toMatch(/whole RWF/);
    expect(checkDelivery('s1', { ...delivery, wall: '' }, NOW).problems.wall).toBe('Enter the date and time it was received.');
    // 12:30 in Kigali is still to come at 12:00.
    const later = checkDelivery('s1', { ...delivery, wall: '2026-11-25T12:30' }, NOW);
    expect(later.problems.wall).toMatch(/has not come yet/);
    expect(later.body).toBeNull();
  });

  it('accepts a count of zero, and refuses a blank or future one', () => {
    const count = { product: 'GASOLINE' as const, quantity: '0', wall: '2026-11-25T07:00', note: ' dip, tanks 1 and 2 ' };
    expect(checkCount('s1', count, NOW).body).toEqual({
      station_id: 's1',
      product: 'GASOLINE',
      quantity: 0,
      occurred_at: '2026-11-25T05:00:00.000Z',
      note: 'dip, tanks 1 and 2',
    });
    expect(checkCount('s1', { ...count, quantity: '' }, NOW).problems.quantity).toMatch(/Enter the quantity you measured/);
    expect(checkCount('s1', { ...count, wall: '2026-11-26T07:00' }, NOW).problems.wall).toMatch(/has not come yet/);
    expect(checkCount('s1', { ...count, quantity: '1,000,000' }, NOW).problems).toEqual({});
    expect(checkCount('s1', { ...count, quantity: '1,000,001' }, NOW).problems.quantity).toMatch(/at most 1,000,000/);
  });

  it('asks for a removal reason of 5 to 300 characters', () => {
    expect(checkReason(' oops ')).toMatch(/at least 5 characters/);
    expect(checkReason('Twice')).toBeUndefined();
    expect(checkReason('x'.repeat(301))).toMatch(/300 characters/);
  });
});

describe('stock API', () => {
  it('reads levels and pages of entries', async () => {
    get.mockResolvedValue({ data: { station_id: 's1', products: [] } });
    await getLevels('s1');
    expect(get).toHaveBeenCalledWith('/stock/s1');

    get.mockResolvedValue({ data: { data: [], pagination: { page: 2, limit: 12, total: 0, total_pages: 0 } } });
    await getEntries('s1', { product: 'DIESEL', kind: 'count', page: 2, limit: 12 });
    expect(get).toHaveBeenLastCalledWith('/stock/s1/entries', {
      params: { product: 'DIESEL', kind: 'count', page: 2, limit: 12 },
    });
    await getEntries('s1', { page: 1, limit: 12 });
    expect(get).toHaveBeenLastCalledWith('/stock/s1/entries', { params: { page: 1, limit: 12 } });
  });

  it('records deliveries and counts, and removes an entry with its reason', async () => {
    post.mockResolvedValue({ data: entry() });
    const delivery = { station_id: 's1', product: 'DIESEL' as const, quantity: 8000, occurred_at: '2026-11-24T08:15:00.000Z' };
    await recordDelivery(delivery);
    expect(post).toHaveBeenLastCalledWith('/stock/deliveries', delivery);
    await recordCount({ ...delivery, quantity: 0 });
    expect(post).toHaveBeenLastCalledWith('/stock/counts', { ...delivery, quantity: 0 });
    post.mockResolvedValue({ data: { id: 'e1', removed_at: '2026-11-25T10:00:00Z' } });
    await removeEntry('e1', 'Entered twice');
    expect(post).toHaveBeenLastCalledWith('/stock/entries/e1/remove', { reason: 'Entered twice' });
  });
});

describe('LevelCard', () => {
  it('shows a counted level and how it was reached', () => {
    render(<LevelCard level={level()} canRecord onCount={vi.fn()} />);
    const card = screen.getByRole('article', { name: 'Gasoline stock' });
    expect(within(card).getByText('12,345.6').className).toContain('text-text');
    expect(card.textContent).toContain('Counted Mon 23 Nov, 08:00');
    expect(card.textContent).toContain('15,000.0 L');
    expect(card.textContent).toContain('+3,000.0 L');
    expect(card.textContent).toContain('−5,654.4 L');
    expect(card.textContent).toContain('Tue 24 Nov, 10:15 · 3,000.0 L · Kivu Fuels');
    expect(within(card).queryByText('Below zero')).toBeNull();
    expect(within(card).queryByRole('button', { name: 'Record a stock count' })).toBeNull();
  });

  it('says the level is unknown without a count, rather than 0, and offers one', async () => {
    const onCount = vi.fn();
    render(<LevelCard level={uncounted({ product: 'ELECTRICITY', unit: 'KWH', last_delivery: null })} canRecord onCount={onCount} />);
    const card = screen.getByRole('article', { name: 'Electricity stock' });
    expect(card.textContent).toContain('In kWh, for EV charging');
    expect(card.textContent).toContain('Unknown');
    expect(card.textContent).toContain('Not counted');
    expect(card.textContent).toContain('None recorded');
    expect(card.textContent).not.toMatch(/\b0\.0\b/);
    await userEvent.click(within(card).getByRole('button', { name: 'Record a stock count' }));
    expect(onCount).toHaveBeenCalledOnce();
  });

  it('keeps the count action from someone who cannot record', () => {
    render(<LevelCard level={uncounted()} canRecord={false} onCount={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Record a stock count' })).toBeNull();
    expect(screen.getByText('A station manager or company admin can record one.')).toBeTruthy();
  });

  it('shows a level below zero, flagged, with what to do about it', () => {
    render(<LevelCard level={level({ level: -120, sold_since_count: 18120 })} canRecord onCount={vi.fn()} />);
    const card = screen.getByRole('article', { name: 'Gasoline stock' });
    expect(within(card).getByText('Below zero')).toBeTruthy();
    expect(within(card).getByText('−120.0').className).toContain('text-danger');
    expect(card.textContent).toContain('Record a count, or a delivery that is missing.');
  });
});

describe('DeliveryDrawer', () => {
  it('works out the cost per litre as it is typed, and sends the delivery', async () => {
    post.mockResolvedValueOnce({ data: entry() });
    const done = vi.fn();
    render(<DeliveryDrawer stationId="s1" product="DIESEL" onClose={vi.fn()} onDone={done} />);
    await userEvent.type(screen.getByLabelText('Litres received'), '8,000');
    await userEvent.type(screen.getByLabelText('Total cost, RWF · optional'), '9,600,000');
    expect(screen.getByText('RWF 1,200 per litre')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Date and time received'), { target: { value: '2026-01-05T08:30' } });
    await userEvent.type(screen.getByLabelText('Delivery note number · optional'), 'DN-4471');
    await userEvent.click(screen.getByRole('button', { name: 'Record delivery' }));
    expect(post).toHaveBeenCalledWith('/stock/deliveries', {
      station_id: 's1',
      product: 'DIESEL',
      quantity: 8000,
      occurred_at: '2026-01-05T06:30:00.000Z',
      reference: 'DN-4471',
      cost_rwf: 9600000,
    });
    expect(done).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
  });

  it('says what is missing before sending, in kWh for electricity', async () => {
    render(<DeliveryDrawer stationId="s1" product="GASOLINE" onClose={vi.fn()} onDone={vi.fn()} />);
    await userEvent.click(screen.getByText('Electricity'));
    expect(screen.getByLabelText('kWh bought')).toBeTruthy();
    expect(screen.getByLabelText('Receipt number · optional')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Date and time bought'), { target: { value: '2999-01-01T08:00' } });
    await userEvent.click(screen.getByRole('button', { name: 'Record delivery' }));
    expect(screen.getByText('Enter how many kWh were bought.')).toBeTruthy();
    expect(screen.getByText('That time has not come yet. Enter when it was bought.')).toBeTruthy();
    expect(screen.getByLabelText('kWh bought').getAttribute('aria-invalid')).toBe('true');
    expect(post).not.toHaveBeenCalled();
  });

  it('shows the API’s refusal and stays open', async () => {
    post.mockRejectedValueOnce(new Error('occurred_at must not be in the future'));
    const done = vi.fn();
    render(<DeliveryDrawer stationId="s1" product="GASOLINE" onClose={vi.fn()} onDone={done} />);
    await userEvent.type(screen.getByLabelText('Litres received'), '500');
    await userEvent.click(screen.getByRole('button', { name: 'Record delivery' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('occurred_at must not be in the future')).toBeTruthy();
    expect(done).not.toHaveBeenCalled();
  });
});

describe('CountDrawer', () => {
  it('records an empty tank as 0', async () => {
    post.mockResolvedValueOnce({ data: entry({ kind: 'count', quantity: 0 }) });
    const done = vi.fn();
    render(<CountDrawer stationId="s1" product="GASOLINE" onClose={vi.fn()} onDone={done} />);
    await userEvent.type(screen.getByLabelText('Litres measured'), '0');
    fireEvent.change(screen.getByLabelText('Date and time measured'), { target: { value: '2026-01-05T07:00' } });
    await userEvent.click(screen.getByRole('button', { name: 'Record count' }));
    expect(post).toHaveBeenCalledWith('/stock/counts', {
      station_id: 's1',
      product: 'GASOLINE',
      quantity: 0,
      occurred_at: '2026-01-05T05:00:00.000Z',
    });
    expect(done).toHaveBeenCalled();
  });

  it('asks for the measured quantity', async () => {
    render(<CountDrawer stationId="s1" product="DIESEL" onClose={vi.fn()} onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Record count' }));
    expect(screen.getByText('Enter the quantity you measured. Enter 0 if it is empty.')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });
});

describe('RemoveEntryDrawer', () => {
  it('needs a reason, then removes the entry', async () => {
    post.mockResolvedValueOnce({ data: { id: 'e1', removed_at: '2026-11-25T10:00:00Z' } });
    const done = vi.fn();
    render(<RemoveEntryDrawer entry={entry()} onClose={vi.fn()} onDone={done} />);
    expect(screen.getByText(/The delivery of 8,000\.0 L of diesel on Tue 24 Nov, 10:15/)).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Reason'), 'oops');
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByText(/at least 5 characters/)).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Reason'), ', entered twice');
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(post).toHaveBeenCalledWith('/stock/entries/e1/remove', { reason: 'oops, entered twice' });
    expect(done).toHaveBeenCalled();
  });
});

describe('EntriesTable', () => {
  it('shows each entry with its cost per unit, and dashes where nothing applies', () => {
    render(
      <EntriesTable
        rows={[
          entry(),
          entry({ id: 'e2', kind: 'count', product: 'ELECTRICITY', unit: 'KWH', quantity: 420.5, supplier: null, reference: null, cost_rwf: null, note: 'Meter read at closing', recorded_by: null }),
        ]}
        canRemove={false}
        onRemove={vi.fn()}
      />,
    );
    const [, delivery, count] = screen.getAllByRole('row');
    expect(delivery.textContent).toContain('Diesel');
    expect(delivery.textContent).toContain('Delivery');
    expect(delivery.textContent).toContain('8,000.0 L');
    expect(delivery.textContent).toContain('DN-4471');
    expect(delivery.textContent).toContain('9,600,000');
    expect(delivery.textContent).toContain('RWF 1,200 per litre');
    expect(delivery.textContent).toContain('Claudine Mukamana');
    expect(count.textContent).toContain('Electricity');
    expect(count.textContent).toContain('Count');
    expect(count.textContent).toContain('420.5 kWh');
    expect(count.textContent).toContain('Meter read at closing');
    expect(within(count).getAllByText('—')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /Actions for/ })).toBeNull();
  });

  it('lets a manager remove an entry from its row', async () => {
    const onRemove = vi.fn();
    render(<EntriesTable rows={[entry()]} canRemove onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for the delivery on Tue 24 Nov, 10:15' }));
    await userEvent.click(await screen.findByText('Remove…'));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
  });
});
