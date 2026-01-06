import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "../types";

export const exportTransactionsToPDF = (transactions: Transaction[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text("WealthWise Financial Report", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Period: All Time`, 14, 28);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

  // Summary Logic
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const saving = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - saving - expense;

  // Summary Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 182, 45, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Overview", 20, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Total Income:`, 20, 60);
  doc.text(`$${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 100, 60);
  
  doc.text(`Total Savings:`, 20, 67);
  doc.text(`$${saving.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 100, 67);

  doc.text(`Total Expenses:`, 20, 74);
  doc.text(`$${expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 100, 74);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`Net Available Balance:`, 20, 81);
  doc.text(`$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 100, 81);

  // Table
  const tableData = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(t => [
      new Date(t.date).toLocaleDateString() + ' ' + new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      t.category,
      t.description,
      t.type.toUpperCase(),
      t.type === 'income' ? `+$${t.amount.toFixed(2)}` : `-$${t.amount.toFixed(2)}`
    ]);

  autoTable(doc, {
    startY: 95,
    head: [['Date', 'Category', 'Description', 'Type', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      3: { halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const text = data.cell.text[0];
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-500
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = [239, 68, 68]; // rose-500
        }
      }
    }
  });

  doc.save(`WealthWise_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};