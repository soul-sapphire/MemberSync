export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  EXCUSED: 'Excused'
};

export const evaluateAttendanceRisk = (attendanceRecords, minRequired = 3, daysBack = 60) => {
  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() - daysBack);

  const recentRecords = attendanceRecords.filter(r => new Date(r.date) >= thresholdDate);
  const presentCount = recentRecords.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
  const unexcusedAbsences = recentRecords.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length;

  return {
    isAtRisk: presentCount < minRequired,
    unexcusedAbsences,
    presentCount,
    shouldSuspend: unexcusedAbsences >= 3
  };
};
