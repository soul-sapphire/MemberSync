/**
 * Member Health Scoring System
 * Calculates a score based on attendance, payment, and violations.
 */

import { calculateViolationPoints } from '../rules/violationRules';
import { evaluateAttendanceRisk } from '../rules/attendanceRules';

export const HEALTH_LABELS = {
  EXCELLENT: 'Excellent',
  AT_RISK: 'At Risk',
  CRITICAL: 'Critical',
};

/**
 * Calculates a member's health score (0-100).
 * 
 * Logic:
 * - Start with 100 points.
 * - Deduct 10 points per violation point.
 * - Deduct 20 points if attendance is at risk.
 * - Deduct 30 points if payment is not 'Paid'.
 * - Deduct 50 points if status is 'Suspended'.
 * - Score is 0 if status is 'Banned'.
 */
export const calculateMemberHealth = (member, attendanceRecords = [], violations = []) => {
  if (member.status === 'Banned') return { score: 0, label: HEALTH_LABELS.CRITICAL };

  let score = 100;

  // 1. Violations
  const violationPoints = calculateViolationPoints(violations);
  score -= (violationPoints * 10);

  // 2. Attendance
  const attendanceStats = evaluateAttendanceRisk(attendanceRecords);
  if (attendanceStats.isAtRisk) {
    score -= 20;
  }

  // 3. Payment
  if (member.paymentStatus !== 'Paid') {
    score -= 30;
  }

  // 4. Status
  if (member.status === 'Suspended') {
    score -= 50;
  }

  // Ensure score stays within 0-100
  score = Math.max(0, Math.min(100, score));

  let label = HEALTH_LABELS.EXCELLENT;
  if (score < 40) {
    label = HEALTH_LABELS.CRITICAL;
  } else if (score < 75) {
    label = HEALTH_LABELS.AT_RISK;
  }

  return { score, label };
};

export const getHealthColor = (label) => {
  switch (label) {
    case HEALTH_LABELS.EXCELLENT: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case HEALTH_LABELS.AT_RISK: return 'text-amber-600 bg-amber-50 border-amber-100';
    case HEALTH_LABELS.CRITICAL: return 'text-rose-600 bg-rose-50 border-rose-100';
    default: return 'text-slate-600 bg-slate-50 border-slate-100';
  }
};
