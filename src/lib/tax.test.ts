import { describe, expect, it } from 'vitest';
import { rwfExact, saleTax, taxLabel, vatIn } from './tax';

describe('VAT', () => {
  it('takes the VAT out of a VAT-inclusive total, as the API and RRA do', () => {
    expect(vatIn(58760, 18)).toBe(8963.39);
    expect(vatIn(73175, 18)).toBe(11162.29);
    expect(vatIn(12160, 0)).toBe(0);
  });

  it('uses the figures recorded with a sale', () => {
    expect(
      saleTax({
        total_amount: 58760,
        tax_type: 'B',
        tax_rate: '18.00',
        vat_amount: '8963.39',
      }),
    ).toEqual({ type: 'B', rate: 18, vat: 8963.39, exclVat: 49796.61 });
    expect(
      saleTax({
        total_amount: 12160,
        tax_type: 'A',
        tax_rate: '0.00',
        vat_amount: '0.00',
      }),
    ).toEqual({ type: 'A', rate: 0, vat: 0, exclVat: 12160 });
  });

  it('works out 18% for a sale recorded before VAT was stored', () => {
    expect(saleTax({ total_amount: 10000 })).toEqual({
      type: 'B',
      rate: 18,
      vat: 1525.42,
      exclVat: 8474.58,
    });
  });

  it('labels and formats', () => {
    expect(taxLabel('B', 18)).toBe('B 18%');
    expect(taxLabel('A', 0)).toBe('A exempt');
    expect(rwfExact(8963.39)).toBe('RWF 8,963.39');
    expect(rwfExact(0)).toBe('RWF 0.00');
  });
});
