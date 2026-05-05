import { normalizeStatus, isExpired } from './reportDataService';
import { safeTimestampToDate } from '../utils/formatters';

export const calculateMetrics = (members, payments) => {
  const totalMembers = members.length;
  
  let activeCount = 0;
  let pendingCount = 0;
  let suspendedCount = 0;
  let expiredCount = 0;
  let rejectedCount = 0;

  members.forEach(m => {
    const status = normalizeStatus(m.status);
    if (status === 'Active') activeCount++;
    else if (status === 'Pending') pendingCount++;
    else if (status === 'Suspended') suspendedCount++;
    else if (status === 'Expired' || isExpired(m.expiryDate)) expiredCount++;
    else if (status === 'Rejected') rejectedCount++;
  });

  const activeRate = totalMembers ? Math.round((activeCount / totalMembers) * 100) : 0;
  const pendingRate = totalMembers ? Math.round((pendingCount / totalMembers) * 100) : 0;

  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return {
    totalMembers,
    activeCount,
    pendingCount,
    suspendedCount,
    expiredCount,
    rejectedCount,
    totalRevenue,
    activeRate,
    pendingRate
  };
};

export const generateInsights = (metrics, reportType, filteredData, extraData = null) => {
  const insights = [];

  if (metrics.totalMembers > 0) {
    insights.push(`${metrics.activeRate}% of all registered members currently hold Active status.`);
  }

  if (metrics.pendingCount > 0) {
    insights.push(`There are ${metrics.pendingCount} member(s) awaiting administrative approval.`);
  }

  if (reportType === 'REVENUE' || reportType === 'PAYMENTS') {
    insights.push(`Total recorded platform revenue is $${metrics.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}.`);
  }

  if (metrics.expiredCount > 0) {
    insights.push(`Attention: ${metrics.expiredCount} membership(s) have expired and require renewal outreach.`);
  }

  if (insights.length === 0) {
    insights.push("Data levels are currently stable with no critical anomalies detected.");
  }

  return insights;
};

export const getStatusDistribution = (members) => {
  const dist = { Active: 0, Pending: 0, Expired: 0, Suspended: 0, Rejected: 0 };
  members.forEach(m => {
    const s = normalizeStatus(m.status);
    if (dist[s] !== undefined) dist[s]++;
  });
  return Object.keys(dist).map(key => ({ label: key, value: dist[key] }));
};

export const getPlanDistribution = (members) => {
  const dist = {};
  members.forEach(m => {
    const plan = m.planName || 'Unknown';
    dist[plan] = (dist[plan] || 0) + 1;
  });
  return Object.keys(dist).map(key => ({ label: key, value: dist[key] }));
};

export const getRevenueByMonth = (payments) => {
  const dist = {};
  payments.forEach(p => {
    const date = safeTimestampToDate(p.paymentDate || p.paidAt || p.createdAt);
    const month = date.toISOString().substring(0, 7); // YYYY-MM
    dist[month] = (dist[month] || 0) + (Number(p.amount) || 0);
  });
  const sortedMonths = Object.keys(dist).sort();
  // Take last 6 months
  return sortedMonths.slice(-6).map(m => ({ label: m, value: dist[m] }));
};
