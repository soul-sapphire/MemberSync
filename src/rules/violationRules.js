export const SEVERITY_POINTS = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 5
};

export const VIOLATION_THRESHOLDS = {
  SUSPENSION: 5,
  BAN: 8
};

export const calculateViolationPoints = (violations) => {
  return violations.reduce((sum, v) => sum + (v.points || SEVERITY_POINTS[v.severity] || 0), 0);
};

export const checkViolationExpiry = (violationDate, expiryMonths = 12) => {
  const expiryDate = new Date(violationDate);
  expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
  return new Date() > expiryDate;
};
