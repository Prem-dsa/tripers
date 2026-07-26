import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react';
import { reportApi } from '../../api';
import { GlassCard, EmptyState, Spinner, Avatar } from '../ui/index';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CAT_ICONS = { hotel:'🏨', food:'🍽️', fuel:'⛽', shopping:'🛍️', taxi:'🚗', flights:'✈️', train:'🚂', entertainment:'🎭', medical:'🏥', other:'📦' };

export default function ReportsTab({ tripId, trip }) {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['report-summary', tripId],
    queryFn: () => reportApi.getSummary(tripId).then(r => r.data),
  });

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(108, 99, 255);
      doc.text('TripSplit AI — Trip Report', 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 80);
      doc.text(`Trip: ${summaryData?.trip?.name}`, 14, 32);
      doc.text(`Destination: ${summaryData?.trip?.destination}`, 14, 40);
      doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 48);

      // Summary
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary', 14, 62);

      autoTable(doc, {
        startY: 68,
        head: [['Metric', 'Value']],
        body: [
          ['Total Expenses', `₹${formatCurrency(summaryData?.totalExpense || 0)}`],
          ['Number of Expenses', summaryData?.expenseCount || 0],
          ['Number of Members', summaryData?.trip?.members?.length || 0],
        ],
        styles: { fillColor: [245, 245, 255] },
        headStyles: { fillColor: [108, 99, 255] },
      });

      // Expenses
      doc.text('Expenses', 14, doc.lastAutoTable.finalY + 14);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Date', 'Name', 'Category', 'Paid By', 'Amount']],
        body: (summaryData?.expenses || []).map(e => [
          format(new Date(e.date), 'MMM d, yyyy'),
          e.name,
          e.category,
          e.paidBy?.fullName || '',
          `₹${formatCurrency(e.amount)}`,
        ]),
        headStyles: { fillColor: [108, 99, 255] },
      });

      // Member contributions
      doc.addPage();
      doc.text('Member Contributions', 14, 20);
      autoTable(doc, {
        startY: 26,
        head: [['Member', 'Total Paid', 'Share', 'Net Balance']],
        body: (summaryData?.memberContributions || []).map(m => [
          m.user?.fullName || '',
          `₹${formatCurrency(m.stats?.totalPaid || 0)}`,
          `₹${formatCurrency(m.stats?.totalShare || 0)}`,
          m.stats?.netBalance >= 0 ? `+₹${formatCurrency(m.stats?.toReceive)}` : `-₹${formatCurrency(m.stats?.toPay)}`,
        ]),
        headStyles: { fillColor: [108, 99, 255] },
      });

      doc.save(`TripSplit_${summaryData?.trip?.name?.replace(/\s/g, '_')}_Report.pdf`);
      toast.success('PDF exported!');
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Expenses sheet
      const expData = (summaryData?.expenses || []).map(e => ({
        Date: format(new Date(e.date), 'MMM d, yyyy'),
        Name: e.name,
        Category: e.category,
        'Paid By': e.paidBy?.fullName,
        Amount: e.amount,
        Currency: e.currency,
        'Split Type': e.splitType,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expData), 'Expenses');

      // Members sheet
      const memberData = (summaryData?.memberContributions || []).map(m => ({
        Name: m.user?.fullName,
        'Total Paid': m.stats?.totalPaid,
        'Total Share': m.stats?.totalShare,
        'Net Balance': m.stats?.netBalance,
        'To Receive': m.stats?.toReceive,
        'To Pay': m.stats?.toPay,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memberData), 'Members');

      // Settlements sheet
      const settData = (summaryData?.settlements || []).map(s => ({
        From: s.from?.fullName,
        To: s.to?.fullName,
        Amount: s.amount,
        Status: s.status,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(settData), 'Settlements');

      XLSX.writeFile(wb, `TripSplit_${summaryData?.trip?.name?.replace(/\s/g, '_')}.xlsx`);
      toast.success('Excel exported!');
    } catch { toast.error('Export failed'); }
  };

  const exportCSV = () => {
    const expenses = summaryData?.expenses || [];
    const rows = [['Date','Name','Category','Paid By','Amount','Split Type']];
    expenses.forEach(e => rows.push([
      format(new Date(e.date), 'MMM d, yyyy'),
      e.name, e.category, e.paidBy?.fullName || '', e.amount, e.splitType
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `TripSplit_Expenses.csv`; a.click();
    toast.success('CSV exported!');
  };

  if (isLoading) return <div className="flex-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div>
        <h3 className="font-bold text-white mb-3">Export Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={exportPDF} className="glass-sm p-4 rounded-xl flex items-center gap-3 hover:bg-white/8 transition-all group">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex-center group-hover:bg-red-500/30 transition-colors">
              <FileText size={20} className="text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Trip Summary PDF</p>
              <p className="text-dark-400 text-xs">Full report with charts</p>
            </div>
            <Download size={16} className="text-dark-400 ml-auto" />
          </button>

          <button onClick={exportExcel} className="glass-sm p-4 rounded-xl flex items-center gap-3 hover:bg-white/8 transition-all group">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex-center group-hover:bg-green-500/30 transition-colors">
              <FileSpreadsheet size={20} className="text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Excel Workbook</p>
              <p className="text-dark-400 text-xs">Expenses, members, settlements</p>
            </div>
            <Download size={16} className="text-dark-400 ml-auto" />
          </button>

          <button onClick={exportCSV} className="glass-sm p-4 rounded-xl flex items-center gap-3 hover:bg-white/8 transition-all group">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex-center group-hover:bg-blue-500/30 transition-colors">
              <Table size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">CSV Expenses</p>
              <p className="text-dark-400 text-xs">Raw data for spreadsheets</p>
            </div>
            <Download size={16} className="text-dark-400 ml-auto" />
          </button>
        </div>
      </div>

      {/* Expense Summary Table */}
      <div>
        <h3 className="font-bold text-white mb-3">Expense Summary</h3>
        <div className="glass-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead><tr>
                <th className="p-3 text-left text-dark-400 text-xs uppercase">Date</th>
                <th className="p-3 text-left text-dark-400 text-xs uppercase">Expense</th>
                <th className="p-3 text-left text-dark-400 text-xs uppercase">Category</th>
                <th className="p-3 text-left text-dark-400 text-xs uppercase">Paid By</th>
                <th className="p-3 text-right text-dark-400 text-xs uppercase">Amount</th>
              </tr></thead>
              <tbody>
                {(summaryData?.expenses || []).map(e => (
                  <tr key={e._id} className="border-t border-white/5 hover:bg-white/3 transition-all">
                    <td className="p-3 text-dark-400 text-xs">{format(new Date(e.date), 'MMM d')}</td>
                    <td className="p-3 text-dark-100 text-sm font-medium">{e.name}</td>
                    <td className="p-3"><span className="text-sm">{CAT_ICONS[e.category]}</span> <span className="text-dark-300 text-xs capitalize">{e.category}</span></td>
                    <td className="p-3 text-dark-200 text-sm">{e.paidBy?.fullName}</td>
                    <td className="p-3 text-right text-white font-semibold text-sm">₹{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
                {summaryData?.expenses?.length > 0 && (
                  <tr className="border-t-2 border-white/15 bg-white/3">
                    <td colSpan={4} className="p-3 text-right text-dark-200 font-semibold">Total</td>
                    <td className="p-3 text-right text-primary-400 font-bold">₹{formatCurrency(summaryData?.totalExpense || 0)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
