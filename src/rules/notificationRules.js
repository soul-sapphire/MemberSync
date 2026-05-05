export const NOTIFICATION_TYPES = {
  EXPIRY_WARNING: 'expiry_warning',
  EXPIRED: 'expired',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  APPROVAL_SUCCESS: 'approval_success',
  APPROVAL_REJECTED: 'approval_rejected',
  VIOLATION_ADDED: 'violation_added',
  ATTENDANCE_WARNING: 'attendance_warning',
  ANNOUNCEMENT: 'announcement',
  RENEWAL_REQUIRED: 'renewal_required'
};

export const getNotificationTemplate = (type, data = {}) => {
  switch (type) {
    case NOTIFICATION_TYPES.EXPIRY_WARNING:
      return {
        title: "Membership Expiring Soon",
        message: `Your membership expires in ${data.daysLeft} days. Renew now to avoid interruption.`,
        type: 'warning'
      };
    case NOTIFICATION_TYPES.EXPIRED:
      return {
        title: "Membership Expired",
        message: "Your membership has expired. Please settle your dues to reactivate.",
        type: 'error'
      };
    case NOTIFICATION_TYPES.PAYMENT_SUCCESS:
      return {
        title: "Payment Received",
        message: `Successfully received payment of $${data.amount}. Thank you!`,
        type: 'success'
      };
    case NOTIFICATION_TYPES.VIOLATION_ADDED:
      return {
        title: "Violation Recorded",
        message: `A ${data.severity} severity violation has been added to your record.`,
        type: 'error'
      };
    default:
      return {
        title: "Notification",
        message: "You have a new message from MemberSync.",
        type: 'info'
      };
  }
};
