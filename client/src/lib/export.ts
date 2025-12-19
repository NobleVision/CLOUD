import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

export interface ExportData {
  title: string;
  subtitle?: string;
  timestamp: Date;
  data: Record<string, any>[];
  columns: { key: string; header: string; width?: number }[];
  summary?: Record<string, string | number>;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(exportData: ExportData): void {
  const { title, data, columns } = exportData;
  
  // Create CSV header
  const headers = columns.map(col => col.header).join(',');
  
  // Create CSV rows
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      // Handle values that might contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  ).join('\n');
  
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${formatDateForFilename(exportData.timestamp)}.csv`;
  saveAs(blob, filename);
}

/**
 * Export data to PDF format
 */
export function exportToPDF(exportData: ExportData): void {
  const { title, subtitle, timestamp, data, columns, summary } = exportData;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add ADP Logo/Header
  doc.setFontSize(20);
  doc.setTextColor(208, 39, 29); // ADP Red (#d0271d)
  doc.text('ADP GCP Observability', 14, 20);
  
  // Add title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 32);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 40);
  }
  
  // Add timestamp
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${timestamp.toLocaleString()}`, 14, subtitle ? 48 : 40);
  
  // Add summary section if provided
  let startY = subtitle ? 56 : 48;
  if (summary) {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 14, startY);
    startY += 6;
    
    doc.setFontSize(9);
    Object.entries(summary).forEach(([key, value], index) => {
      doc.text(`${key}: ${value}`, 14, startY + (index * 5));
    });
    startY += Object.keys(summary).length * 5 + 8;
  }
  
  // Add data table
  if (data.length > 0) {
    autoTable(doc, {
      startY,
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value.toFixed(2);
        return String(value);
      })),
      theme: 'striped',
      headStyles: {
        fillColor: [208, 39, 29], // ADP Red (#d0271d)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: columns.reduce((acc, col, index) => {
        if (col.width) acc[index] = { cellWidth: col.width };
        return acc;
      }, {} as Record<number, { cellWidth: number }>),
    });
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
    doc.text('ADP GCP Observability Dashboard', 14, doc.internal.pageSize.getHeight() - 10);
  }
  
  const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${formatDateForFilename(timestamp)}.pdf`;
  doc.save(filename);
}

/**
 * Export chart as image
 */
export async function exportChartAsImage(chartRef: HTMLCanvasElement, title: string): Promise<void> {
  const dataUrl = chartRef.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_${formatDateForFilename(new Date())}.png`;
  link.href = dataUrl;
  link.click();
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Export JSON data
 */
export function exportToJSON(exportData: ExportData): void {
  const { title, timestamp, data, summary } = exportData;
  const json = JSON.stringify({ title, timestamp: timestamp.toISOString(), summary, data }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${formatDateForFilename(timestamp)}.json`;
  saveAs(blob, filename);
}

