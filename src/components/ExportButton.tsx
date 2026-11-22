'use client';

import React from 'react';
import { Dropdown } from 'antd';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { themedColors } from '@/theme/tokens';

/**
 * Exports are printed and filed, so they use the light theme's brand colours
 * whatever the screen shows: a forest header with cream text, and the page
 * colour on alternate rows.
 */
const BRAND = themedColors.light;
const toRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const argb = (hex: string) => `FF${hex.slice(1).toUpperCase()}`;
/** jsPDF sizes in points: a table that fits a landscape page. */
const PDF_TABLE_PT = 8;
const PDF_TITLE_PT = 16;
const PDF_NOTE_PT = 10;

interface ExportColumn {
  header: string;
  key: string;
}

interface ExportButtonProps {
  data: object[];
  columns: ExportColumn[];
  filename: string;
  /** The button's text; "Export" unless the page names what it exports. */
  label?: string;
}

export default function ExportButton({ data, columns, filename, label = 'Export' }: ExportButtonProps) {
  const exportToExcel = async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: 20,
    }));

    worksheet.getRow(1).font = { bold: true, color: { argb: argb(BRAND['on-primary']) } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: argb(BRAND.primary) },
    };

    data.forEach((row) => {
      const rowData: Record<string, unknown> = {};
      const r = row as Record<string, unknown>;
      columns.forEach((col) => {
        rowData[col.key] = r[col.key] ?? '';
      });
      worksheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(PDF_TITLE_PT);
    doc.setTextColor(...toRgb(BRAND.primary));
    doc.text('Relai Report', 14, 15);

    doc.setFontSize(PDF_NOTE_PT);
    doc.setTextColor(...toRgb(BRAND['text-muted']));
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const headers = columns.map((c) => c.header);
    const rows = data.map((row) =>
      columns.map((col) => String((row as Record<string, unknown>)[col.key] ?? ''))
    );

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      headStyles: {
        fillColor: toRgb(BRAND.primary),
        textColor: toRgb(BRAND['on-primary']),
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: toRgb(BRAND.bg) },
      styles: { fontSize: PDF_TABLE_PT, textColor: toRgb(BRAND.text) },
    });

    doc.save(`${filename}.pdf`);
  };

  const items = [
    {
      key: 'excel',
      icon: <FileSpreadsheet size={16} aria-hidden />,
      label: 'Excel spreadsheet',
      onClick: exportToExcel,
    },
    {
      key: 'pdf',
      icon: <FileText size={16} aria-hidden />,
      label: 'PDF',
      onClick: exportToPdf,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button icon={Download}>{label}</Button>
    </Dropdown>
  );
}
