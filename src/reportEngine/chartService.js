export const drawBarChart = (doc, title, data, x, y, width, height) => {
  if (!data || data.length === 0) return;

  // Chart Background
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(x, y, width, height, 3, 3, 'F');
  
  // Title
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFont("helvetica", "bold");
  doc.text(title, x + 5, y + 8);

  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  const chartX = x + 10;
  const chartY = y + 15;
  const chartWidth = width - 20;
  const chartHeight = height - 25;
  
  const barCount = data.length;
  const barSpacing = chartWidth * 0.1 / (barCount + 1);
  const barWidth = (chartWidth * 0.9) / barCount;

  // Draw axes
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  // Draw bars
  data.forEach((item, index) => {
    const barH = (item.value / maxValue) * chartHeight;
    const bx = chartX + barSpacing + (barWidth + barSpacing) * index;
    const by = chartY + chartHeight - barH;

    // Determine color based on label (naive approach)
    if (item.label === 'Active') doc.setFillColor(16, 185, 129); // emerald-500
    else if (item.label === 'Pending') doc.setFillColor(245, 158, 11); // amber-500
    else if (item.label === 'Expired' || item.label === 'Suspended') doc.setFillColor(244, 63, 94); // rose-500
    else doc.setFillColor(79, 70, 229); // brand-600 default

    doc.rect(bx, by, barWidth, barH, 'F');

    // Label under bar
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    
    // Truncate label if too long
    let label = item.label;
    if (label.length > 8) label = label.substring(0, 7) + '..';
    
    const textWidth = doc.getTextWidth(label);
    const tx = bx + (barWidth / 2) - (textWidth / 2);
    doc.text(label, tx, chartY + chartHeight + 5);

    // Value above bar
    const valText = item.value.toString();
    const valWidth = doc.getTextWidth(valText);
    const vx = bx + (barWidth / 2) - (valWidth / 2);
    if (barH > 5) {
      doc.text(valText, vx, by - 2);
    }
  });
};
