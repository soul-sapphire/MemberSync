import { normalizeStatus, isExpired } from './reportDataService';
import { getStatusDistribution, getPlanDistribution, getRevenueByMonth } from './analyticsService';

export const reportTemplates = {
  ALL_MEMBERS: {
    title: "Complete Membership Directory",
    prefix: "MS-ALL",
    getColumns: () => ["No", "Member ID", "Name", "Email", "Phone", "Plan", "Status", "Join Date", "Expiry Date"],
    filterData: (members) => members,
    mapRows: (filtered) => filtered.map((m, i) => [
      i + 1, m.memberId || 'N/A', m.fullName || 'Unknown', m.email || 'N/A', 
      m.phone || 'N/A', m.planName || 'N/A', normalizeStatus(m.status), 
      m.joinDate || 'N/A', m.expiryDate || 'N/A'
    ]),
    getVisuals: (filtered) => [
      getStatusDistribution(filtered),
      getPlanDistribution(filtered)
    ]
  },
  ACTIVE_MEMBERS: {
    title: "Active Members Report",
    prefix: "MS-ACT",
    getColumns: () => ["No", "Member ID", "Name", "Email", "Plan", "Join Date", "Expiry Date"],
    filterData: (members) => members.filter(m => normalizeStatus(m.status) === 'Active'),
    mapRows: (filtered) => filtered.map((m, i) => [
      i + 1, m.memberId || 'N/A', m.fullName || 'Unknown', m.email || 'N/A', 
      m.planName || 'N/A', m.joinDate || 'N/A', m.expiryDate || 'N/A'
    ]),
    getVisuals: (filtered) => [
      getPlanDistribution(filtered)
    ]
  },
  PENDING_MEMBERS: {
    title: "Pending Approvals Report",
    prefix: "MS-PND",
    getColumns: () => ["No", "Member ID", "Name", "Email", "Plan", "Join Date"],
    filterData: (members) => members.filter(m => normalizeStatus(m.status) === 'Pending'),
    mapRows: (filtered) => filtered.map((m, i) => [
      i + 1, m.memberId || 'N/A', m.fullName || 'Unknown', m.email || 'N/A', 
      m.planName || 'N/A', m.joinDate || 'N/A'
    ]),
    getVisuals: (filtered) => [
      getPlanDistribution(filtered)
    ]
  },
  EXPIRED_MEMBERS: {
    title: "Expired Memberships Report",
    prefix: "MS-EXP",
    getColumns: () => ["No", "Member ID", "Name", "Email", "Phone", "Plan", "Expiry Date"],
    filterData: (members) => members.filter(m => normalizeStatus(m.status) === 'Expired' || isExpired(m.expiryDate)),
    mapRows: (filtered) => filtered.map((m, i) => [
      i + 1, m.memberId || 'N/A', m.fullName || 'Unknown', m.email || 'N/A', 
      m.phone || 'N/A', m.planName || 'N/A', m.expiryDate || 'N/A'
    ]),
    getVisuals: (filtered) => [
      getPlanDistribution(filtered)
    ]
  },
  SUSPENDED_MEMBERS: {
    title: "Suspended Accounts Report",
    prefix: "MS-SUS",
    getColumns: () => ["No", "Member ID", "Name", "Email", "Plan", "Join Date"],
    filterData: (members) => members.filter(m => normalizeStatus(m.status) === 'Suspended'),
    mapRows: (filtered) => filtered.map((m, i) => [
      i + 1, m.memberId || 'N/A', m.fullName || 'Unknown', m.email || 'N/A', 
      m.planName || 'N/A', m.joinDate || 'N/A'
    ]),
    getVisuals: (filtered) => [
      getPlanDistribution(filtered)
    ]
  },
  PAYMENTS_SUMMARY: {
    title: "Payment Transactions Summary",
    prefix: "MS-PAY",
    getColumns: () => ["No", "Member", "Member ID", "Amount", "Method", "Status", "Paid Date", "Notes"],
    filterData: (members, payments) => payments, // We operate on payments here
    mapRows: (filtered) => filtered.map((p, i) => [
      i + 1, p.fullName || 'Unknown', p.memberId || 'N/A', 
      `$${(Number(p.amount) || 0).toFixed(2)}`, p.method || 'N/A', 
      p.status || 'Paid', p.paidAt || 'N/A', p.notes || ''
    ]),
    getVisuals: (filtered) => [
      getRevenueByMonth(filtered)
    ]
  },
  REVENUE_REPORT: {
    title: "Monthly Revenue Analytics",
    prefix: "MS-REV",
    getColumns: () => ["Month", "Transactions", "Revenue"],
    filterData: (members, payments) => {
      const dist = {};
      payments.forEach(p => {
        if (!p.paidAt) return;
        const month = p.paidAt.substring(0, 7);
        if (!dist[month]) dist[month] = { count: 0, sum: 0 };
        dist[month].count++;
        dist[month].sum += Number(p.amount) || 0;
      });
      return Object.keys(dist).sort().reverse().map(m => ({ month: m, ...dist[m] }));
    },
    mapRows: (filtered) => filtered.map(item => [
      item.month, item.count.toString(), `$${item.sum.toFixed(2)}`
    ]),
    getVisuals: (filtered, payments) => [
      getRevenueByMonth(payments)
    ]
  },
  PLAN_DISTRIBUTION: {
    title: "Membership Plan Distribution",
    prefix: "MS-PLN",
    getColumns: () => ["No", "Member ID", "Name", "Plan", "Status"],
    filterData: (members) => members,
    mapRows: (filtered) => filtered.map((m, i) => [
      i + 1, m.memberId || 'N/A', m.fullName || 'Unknown', 
      m.planName || 'N/A', normalizeStatus(m.status)
    ]),
    getVisuals: (filtered) => [
      getPlanDistribution(filtered),
      getStatusDistribution(filtered)
    ]
  }
};
