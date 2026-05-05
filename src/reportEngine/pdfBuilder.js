import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawBarChart } from './chartService';

export const buildProfessionalPDF = ({
  reportId,
  title,
  metrics,
  insights,
  columns,
  rows,
  visualData
}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const dateStr = new Date().toLocaleString();

  // ----- SECTION 1: Cover Header -----
  doc.setFillColor(15, 23, 42); // slate-900 (Navy)
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Brand Logo Mark
  doc.setFillColor(79, 70, 229); // brand-600
  doc.roundedRect(14, 10, 20, 20, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("M", 21, 24);

  // Title & Subtitle
  doc.setFontSize(22);
  doc.text("MemberSync Enterprise", 40, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont("helvetica", "normal");
  doc.text(title, 40, 28);

  // Meta details (Right aligned)
  doc.setFontSize(9);
  doc.text(`Report ID: ${reportId}`, pageWidth - 14, 15, { align: 'right' });
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 21, { align: 'right' });
  doc.text("Prepared by: Admin", pageWidth - 14, 27, { align: 'right' });
  
  doc.setFillColor(225, 29, 72); // rose-600
  doc.roundedRect(pageWidth - 45, 30, 31, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENTIAL", pageWidth - 29, 34, { align: 'center' });

  // ----- SECTION 2: Executive Summary -----
  let currentY = 50;
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Executive Summary", 14, currentY);
  currentY += 8;

  const summaryCards = [
    { label: "TOTAL MEMBERS", value: metrics.totalMembers.toString() },
    { label: "ACTIVE MEMBERS", value: metrics.activeCount.toString() },
    { label: "PENDING", value: metrics.pendingCount.toString() },
    { label: "REVENUE", value: `$${metrics.totalRevenue.toLocaleString()}` }
  ];

  const cardWidth = (pageWidth - 28 - (summaryCards.length - 1) * 5) / summaryCards.length;
  
  summaryCards.forEach((card, index) => {
    const x = 14 + index * (cardWidth + 5);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(x, currentY, cardWidth, 20, 2, 2, 'F');
    
    // Top border accent
    doc.setFillColor(79, 70, 229);
    doc.rect(x, currentY, cardWidth, 2, 'F');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("helvetica", "bold");
    doc.text(card.label, x + 5, currentY + 8);

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, x + 5, currentY + 16);
  });

  currentY += 30;

  // ----- SECTION 3: Analytics / Visual Insights -----
  doc.setFontSize(14);
  doc.text("Visual Insights", 14, currentY);
  currentY += 6;

  if (visualData && visualData.length > 0) {
    const chartW = (pageWidth - 33) / 2;
    drawBarChart(doc, "Distribution", visualData[0], 14, currentY, chartW, 40);
    if (visualData[1]) {
      drawBarChart(doc, "Trends", visualData[1], 14 + chartW + 5, currentY, chartW, 40);
    }
    currentY += 50;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("No visual data available for this report.", 14, currentY + 5);
    currentY += 15;
  }

  // ----- SECTION 4: Detailed Data Table -----
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Data Table", 14, currentY);
  
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: currentY + 5,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 15, left: 14, right: 14 },
    showHead: 'everyPage',
    didDrawPage: function (data) {
      // Footer injected here automatically per page by the bottom logic if needed,
      // But we will do a manual loop at the end.
    }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Add new page if Insights won't fit
  if (currentY + 40 > pageHeight) {
    doc.addPage();
    currentY = 20;
  }

  // ----- SECTION 5: Insights and Observations -----
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Automated Insights & Observations", 14, currentY);
  currentY += 8;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 5 + insights.length * 8, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  
  insights.forEach((insight, idx) => {
    doc.text(`• ${insight}`, 18, currentY + 7 + (idx * 8));
  });

  // ----- SECTION 6: Footer (Apply to all pages) -----
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Top boundary line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont("helvetica", "normal");
    
    doc.text("MemberSync Enterprise Management System", 14, pageHeight - 7);
    doc.text("STRICTLY CONFIDENTIAL - INTERNAL USE ONLY", pageWidth / 2, pageHeight - 7, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  doc.save(`${reportId}.pdf`);
  return true;
};
