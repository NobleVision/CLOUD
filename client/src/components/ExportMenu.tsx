import { Download, FileText, FileSpreadsheet, FileJson, Image } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { exportToCSV, exportToPDF, exportToJSON, exportChartAsImage, ExportData } from '@/lib/export';
import { toast } from 'sonner';

interface ExportMenuProps {
  data: Record<string, any>[];
  columns: { key: string; header: string; width?: number }[];
  title: string;
  subtitle?: string;
  summary?: Record<string, string | number>;
  chartRef?: React.RefObject<HTMLCanvasElement>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportMenu({
  data,
  columns,
  title,
  subtitle,
  summary,
  chartRef,
  variant = 'outline',
  size = 'default',
}: ExportMenuProps) {
  const exportData: ExportData = {
    title,
    subtitle,
    timestamp: new Date(),
    data,
    columns,
    summary,
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(exportData);
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('CSV export error:', error);
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(exportData);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    }
  };

  const handleExportJSON = () => {
    try {
      exportToJSON(exportData);
      toast.success('JSON exported successfully');
    } catch (error) {
      toast.error('Failed to export JSON');
      console.error('JSON export error:', error);
    }
  };

  const handleExportChart = async () => {
    if (!chartRef?.current) {
      toast.error('No chart available to export');
      return;
    }
    try {
      await exportChartAsImage(chartRef.current, title);
      toast.success('Chart image exported successfully');
    } catch (error) {
      toast.error('Failed to export chart');
      console.error('Chart export error:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer">
          <FileJson className="h-4 w-4 mr-2 text-blue-600" />
          Export as JSON
        </DropdownMenuItem>
        {chartRef && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportChart} className="cursor-pointer">
              <Image className="h-4 w-4 mr-2 text-purple-600" />
              Export Chart Image
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

