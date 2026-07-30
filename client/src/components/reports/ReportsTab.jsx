import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
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

      doc.setFontSize(22);
      doc.setTextColor(124, 92, 252);
      doc.text('Tripers — Trip Report', 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 80);
      doc.text(`Trip: ${summaryData?.trip?.name}`, 14, 32);
      doc.text(`Destination: ${summaryData?.trip?.destination}`, 14, 40);
      doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 48);

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
        headStyles: { fillColor: [124, 92, 252] },
      });

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
        headStyles: { fillColor: [124, 92, 252] },
      });

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
        headStyles: { fillColor: [124, 92, 252] },
      });

      doc.save(`Tripers_${summaryData?.trip?.name?.replace(/\s/g, '_')}_Report.pdf`);
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

      const memberData = (summaryData?.memberContributions || []).map(m => ({
        Name: m.user?.fullName,
        'Total Paid': m.stats?.totalPaid,
        'Total Share': m.stats?.totalShare,
        'Net Balance': m.stats?.netBalance,
        'To Receive': m.stats?.toReceive,
        'To Pay': m.stats?.toPay,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memberData), 'Members');

      const settData = (summaryData?.settlements || []).map(s => ({
        From: s.from?.fullName,
        To: s.to?.fullName,
        Amount: s.amount,
        Status: s.status,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(settData), 'Settlements');

      XLSX.writeFile(wb, `Tripers_${summaryData?.trip?.name?.replace(/\s/g, '_')}.xlsx`);
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
    const a = document.createElement('a'); a.href = url; a.download = `Tripers_Expenses.csv`; a.click();
    toast.success('CSV exported!');
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-8">
      {/* Export Buttons */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.button
            onClick={exportPDF}
            className="p-5 bg-white/70 backdrop-blur-[30px] border border-white/60 rounded-[24px] flex items-center gap-4 hover:shadow-float hover:bg-white transition-all duration-300 group shadow-sm text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-11 h-11 bg-rose-50 border border-rose-100 rounded-[16px] flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={20} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 font-bold text-[13px]">Trip Summary PDF</p>
              <p className="text-slate-500 text-[11px] font-medium mt-0.5">Full report with charts</p>
            </div>
            <Download size={16} className="text-slate-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
          </motion.button>

          <motion.button
            onClick={exportExcel}
            className="p-5 bg-white/70 backdrop-blur-[30px] border border-white/60 rounded-[24px] flex items-center gap-4 hover:shadow-float hover:bg-white transition-all duration-300 group shadow-sm text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-[16px] flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={20} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 font-bold text-[13px]">Excel Workbook</p>
              <p className="text-slate-500 text-[11px] font-medium mt-0.5">Expenses & members</p>
            </div>
            <Download size={16} className="text-slate-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
          </motion.button>

          <motion.button
            onClick={exportCSV}
            className="p-5 bg-white/70 backdrop-blur-[30px] border border-white/60 rounded-[24px] flex items-center gap-4 hover:shadow-float hover:bg-white transition-all duration-300 group shadow-sm text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-[16px] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Table size={20} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 font-bold text-[13px]">CSV Expenses</p>
              <p className="text-slate-500 text-[11px] font-medium mt-0.5">Raw data spreadsheet</p>
            </div>
            <Download size={16} className="text-slate-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
          </motion.button>
        </div>
      </div>

      {/* Expense Summary Table */}
      <GlassCard className="!p-8 bg-white/70 backdrop-blur-[30px] border-white/60 shadow-sm rounded-[28px] overflow-hidden">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/60 pb-3 mb-6">Expense Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60">
                <th className="pb-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Date</th>
                <th className="pb-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Expense</th>
                <th className="pb-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Category</th>
                <th className="pb-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Paid By</th>
                <th className="pb-3 text-right text-slate-400 text-[10px] font-bold uppercase tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {(summaryData?.expenses || []).map(e => (
                <tr key={e._id} className="hover:bg-white/60 transition-colors">
                  <td className="py-3.5 text-slate-400 font-medium">{format(new Date(e.date), 'MMM d')}</td>
                  <td className="py-3.5 text-slate-800 font-bold">{e.name}</td>
                  <td className="py-3.5"><span className="mr-1.5">{CAT_ICONS[e.category]}</span> <span className="text-slate-500 font-semibold capitalize text-xs">{e.category}</span></td>
                  <td className="py-3.5 text-slate-600 font-medium">{e.paidBy?.fullName}</td>
                  <td className="py-3.5 text-right text-slate-800 font-bold">₹{formatCurrency(e.amount)}</td>
                </tr>
              ))}
              {summaryData?.expenses?.length > 0 && (
                <tr className="border-t-2 border-slate-200 font-bold bg-white/40">
                  <td colSpan={4} className="py-4 text-right text-slate-500 uppercase tracking-widest text-[11px]">Total</td>
                  <td className="py-4 text-right text-primary-500 font-extrabold text-base">₹{formatCurrency(summaryData?.totalExpense || 0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
