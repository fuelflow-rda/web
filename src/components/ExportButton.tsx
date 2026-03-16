'use client';

import React from 'react';
import { Button, Dropdown } from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';

interface ExportColumn {
  header: string;
  key: string;
}

interface ExportButtonProps {
  data: object[];
  columns: ExportColumn[];
  filename: string;
}

export default function ExportButton({ data, columns, filename }: ExportButtonProps) {
  const exportToExcel = async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: 20,
    }));

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF97316' },
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

    doc.setFontSize(16);
    doc.setTextColor(249, 115, 22);
    doc.text('FuelFlow Report', 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
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
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      styles: { fontSize: 8 },
    });

    doc.save(`${filename}.pdf`);
  };

  const items = [
    {
      key: 'excel',
      icon: <FileExcelOutlined className="!text-green-600" />,
      label: <span className="font-medium">Export to Excel</span>,
      onClick: exportToExcel,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined className="!text-red-500" />,
      label: <span className="font-medium">Export to PDF</span>,
      onClick: exportToPdf,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button
        icon={<DownloadOutlined />}
        className="!rounded-xl !font-semibold !border-gray-200 hover:!border-fuel-orange hover:!text-fuel-orange"
      >
        Export
      </Button>
    </Dropdown>
  );
}
