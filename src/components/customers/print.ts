import { fixedColors, themedColors } from '@/theme/tokens';

/**
 * Printable member cards and voucher sheets (Pencil "Print / Member card" and
 * "Print / Voucher sheet · A4"), as PDFs. The QR holds the same code that is
 * printed under it, which is what the attendant's scanner reads or the
 * attendant types.
 *
 * Paper is always light, so the light theme's colours are used; the card's
 * front uses the brand's dark green.
 */

const C = themedColors.light;
/** Blank modules around a QR code, so a scanner finds its edges. */
const QUIET_ZONE = 2;

async function qr(code: string): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(code, { margin: QUIET_ZONE, width: 320, errorCorrectionLevel: 'M', color: { dark: C.text, light: C.surface } });
}

async function newPdf(format: [number, number] | 'a4', orientation: 'landscape' | 'portrait') {
  const { default: jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'mm', format, orientation });
}

export interface PrintableCard {
  companyName: string;
  customerName: string;
  holderName: string | null;
  plate: string | null;
  code: string;
  label: string;
}

/** A member card, front and back, at bank-card size (85.6 × 54 mm). */
export async function printCard(card: PrintableCard): Promise<void> {
  const W = 85.6;
  const H = 54;
  const doc = await newPdf([W, H], 'landscape');

  doc.setFillColor(fixedColors['inverse-bg']);
  doc.rect(0, 0, W, H, 'F');
  doc.setTextColor(fixedColors['inverse-text']);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(card.companyName, 6, 10);
  doc.setTextColor(fixedColors['inverse-accent']);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('MEMBER CARD', 6, 14.5, { charSpace: 0.4 });
  doc.setTextColor(fixedColors['inverse-text']);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(card.customerName, 6, 40, { maxWidth: W - 12 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(fixedColors['inverse-text-secondary']);
  if (card.holderName) doc.text(card.holderName, 6, 46);
  doc.text(card.plate ?? card.label, W - 6, 46, { align: 'right' });

  doc.addPage([W, H], 'landscape');
  doc.setFillColor(C['surface-muted']);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(C.surface);
  doc.roundedRect(5, 5, 34, 34, 2, 2, 'F');
  doc.addImage(await qr(card.code), 'PNG', 7, 7, 30, 30);
  doc.setTextColor(C.text);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text(card.code, 22, 45, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(doc.splitTextToSize('Show this card at the pump. The attendant scans the code.', 38), 43, 10);
  doc.setTextColor(C['text-secondary']);
  doc.setFontSize(6.5);
  doc.text(doc.splitTextToSize(`Works at every ${card.companyName} station. Spends the account's prepaid balance, with its discount.`, 38), 43, 22);
  doc.text(doc.splitTextToSize('Lost it? Tell your account manager to stop it.', 38), 43, 36);

  doc.save(`card-${card.label.replace(/[^0-9]/g, '')}-${card.customerName.replace(/[^A-Za-z0-9]+/g, '-')}.pdf`);
}

export interface PrintableVoucherBatch {
  companyName: string;
  name: string;
  kind: 'prepaid' | 'promo';
  /** "RWF 20,000", "50 RWF off per litre", "RWF 2,000 off". */
  valueText: string;
  expiresOn: string;
  forName: string | null;
  codes: string[];
}

/** An A4 sheet of eight vouchers per page, with dashed lines to cut along. */
export async function printVoucherSheet(batch: PrintableVoucherBatch): Promise<void> {
  const doc = await newPdf('a4', 'portrait');
  const M = 10;
  const COLS = 2;
  const ROWS = 4;
  const TW = (210 - 2 * M) / COLS;
  const TH = 62;
  const PER = COLS * ROWS;
  const pages = Math.max(1, Math.ceil(batch.codes.length / PER));
  const until = new Date(`${batch.expiresOn}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const images = await Promise.all(batch.codes.map(qr));

  for (let page = 0; page < pages; page++) {
    if (page) doc.addPage('a4', 'portrait');
    doc.setTextColor(C.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${batch.companyName} · fuel vouchers`, M, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(C['text-muted']);
    doc.text(`${batch.name} · ${batch.codes.length} vouchers`, M, 18.5);
    doc.text(`PAGE ${page + 1} OF ${pages}`, 210 - M, 18.5, { align: 'right' });

    batch.codes.slice(page * PER, page * PER + PER).forEach((code, i) => {
      const x = M + (i % COLS) * TW;
      const y = 26 + Math.floor(i / COLS) * TH;
      doc.setDrawColor(C['border-strong']);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.rect(x, y, TW, TH);
      doc.setLineDashPattern([], 0);
      doc.setTextColor(C.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(batch.companyName, x + 5, y + 10);
      doc.setTextColor(C['accent-text']);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text(batch.kind === 'prepaid' ? 'PREPAID FUEL VOUCHER' : 'PROMO VOUCHER', x + 5, y + 15, { charSpace: 0.3 });
      doc.setTextColor(C.text);
      doc.setFont('courier', 'bold');
      doc.setFontSize(batch.valueText.length > 12 ? 11 : 16);
      doc.text(doc.splitTextToSize(batch.valueText, TW - 46), x + 5, y + 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(C['text-secondary']);
      doc.text(doc.splitTextToSize(`One sale, any ${batch.companyName} station. Valid until ${until}.`, TW - 46), x + 5, y + 38);
      if (batch.forName) doc.text(batch.forName, x + 5, y + 53);
      const q = 32;
      doc.addImage(images[page * PER + i], 'PNG', x + TW - q - 6, y + 8, q, q);
      doc.setTextColor(C.text);
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.text(code, x + TW - 6 - q / 2, y + 47, { align: 'center' });
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(C['text-muted']);
    doc.text('Cut along the dashed lines. Each code works once; Relai records where and when it was used.', M, 26 + ROWS * TH + 7);
  }
  doc.save(`vouchers-${batch.name.replace(/[^A-Za-z0-9]+/g, '-')}.pdf`);
}
