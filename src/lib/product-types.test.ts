import { describe, expect, it } from 'vitest';
import { productList } from './product-types';

describe('productList', () => {
  it('lists what a company sells as a sentence, in the usual order', () => {
    expect(productList(['EV_DC_FAST', 'DIESEL', 'EV_AC', 'GASOLINE'])).toBe('Gasoline, diesel, EV AC, EV DC');
    expect(productList(['EV_AC', 'DIESEL'])).toBe('Diesel, EV AC');
    expect(productList(['EV_DC_ULTRA'])).toBe('EV DC ultra');
    expect(productList([])).toBe('');
  });
});
