/**
 * VAT on a sale. The API records each sale's EBM tax type, rate and VAT when it
 * saves it (relai-api trg_transaction_tax): A exempt, B 18%, C, D. Prices
 * include VAT, so the VAT in a sale is total x rate / (100 + rate), to two
 * decimals: RWF 58,760 holds RWF 8,963.39.
 */

export interface SaleTaxFields {
  total_amount: number;
  tax_type?: string | null;
  tax_rate?: number | string | null;
  vat_amount?: number | string | null;
}

export function vatIn(total: number, rate: number): number {
  if (!(rate > 0)) return 0;
  return Math.round(((total * rate) / (100 + rate)) * 100) / 100;
}

/** The tax recorded with a sale; worked out at 18% for one recorded before VAT was stored. */
export function saleTax(sale: SaleTaxFields): {
  type: string;
  rate: number;
  vat: number;
  exclVat: number;
} {
  const type = sale.tax_type ?? 'B';
  const rate = sale.tax_rate == null ? 18 : Number(sale.tax_rate);
  const vat =
    sale.vat_amount == null
      ? vatIn(sale.total_amount, rate)
      : Number(sale.vat_amount);
  return {
    type,
    rate,
    vat,
    exclVat: Math.round((sale.total_amount - vat) * 100) / 100,
  };
}

/** 'B 18%', or 'A exempt'. */
export function taxLabel(type: string, rate: number): string {
  return rate > 0 ? `${type} ${rate}%` : `${type} exempt`;
}

/** 'RWF 8,963.39': an amount with cents, for VAT. */
export function rwfExact(amount: number): string {
  return `RWF ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
