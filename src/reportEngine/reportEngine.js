import { calculateMetrics, generateInsights } from './analyticsService';
import { reportTemplates } from './reportTemplates';
import { buildProfessionalPDF } from './pdfBuilder';
import toast from 'react-hot-toast';


const convertToCSV = (rows) => {
  if (!rows || rows.length === 0) return "";

  const headers = Object.keys(rows[0]);

  const csvRows = [
    headers.join(","), // header row
    ...rows.map(row =>
      headers.map(field => {
        const value = row[field] ?? "";
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(",")
    )
  ];

  return csvRows.join("\n");
};

export const generateCSVReport = (reportType, allMembers, allPayments) => {
  const template = reportTemplates[reportType];
  if (!template) {
    toast.error("Unknown report type selected.");
    return false;
  }

  const filteredData = template.filterData(allMembers, allPayments);
  const rows = template.mapRows(filteredData);

  if (!rows || rows.length === 0) {
    toast.error("No data available for CSV export.");
    return false;
  }

  try {

    const csv = convertToCSV(rows);


    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute("href", url);
    link.setAttribute("download", `${template.prefix}_${dateStr}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("CSV report generated!");
    return true;


  } catch (err) {
    console.error(err);
    toast.error("Failed to generate CSV.");
    return false;
  }
};

export const generateReport = (reportType, allMembers, allPayments) => {
  const template = reportTemplates[reportType];
  if (!template) {
    toast.error("Unknown report type selected.");
    return false;
  }

  // 1. Filter Data specific to report
  const filteredData = template.filterData(allMembers, allPayments);

  // 2. Map Rows
  const rows = template.mapRows(filteredData);
  if (!rows || rows.length === 0) {
    toast.error("No data available for this report.");
    return false;
  }

  // 3. Calculate Global Metrics
  const metrics = calculateMetrics(allMembers, allPayments);

  // 4. Generate Visual Data
  let visualData = [];
  if (template.getVisuals) {
    visualData = template.getVisuals(filteredData, allPayments);
  }

  // 5. Generate Automated Insights
  const extraData = {};

  if (reportType === 'REVENUE' || reportType === 'PAYMENTS') {
    const revByMonth = visualData[0] || [];
    if (revByMonth.length > 0) {
      const highest = [...revByMonth].sort((a, b) => b.value - a.value)[0];
      if (highest) extraData.topMonth = highest.label;
    }
  }

  if (reportType === 'PLAN_DISTRIBUTION') {
    const planDist = visualData[0] || [];
    if (planDist.length > 0) {
      const highest = [...planDist].sort((a, b) => b.value - a.value)[0];
      if (highest) extraData.topPlan = highest.label;
    }
  }

  const insights = generateInsights(metrics, reportType, filteredData, extraData);

  // 6. Assemble unique ID
  const dateStr = new Date().toISOString().replace(/[-:]/g, '').split('T')[0];
  const randStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const reportId = `${template.prefix}-${dateStr}-${randStr}`;

  // 7. Render PDF
  return buildProfessionalPDF({
    reportId,
    title: template.title,
    metrics,
    insights,
    columns: template.getColumns(),
    rows,
    visualData
  });
};
