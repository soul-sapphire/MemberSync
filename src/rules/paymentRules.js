export const validatePayment = (plan, amount, isAdminOverride = false) => {
  if (plan.price === 0) {
    return { valid: true, requiresPayment: false };
  }

  if (!isAdminOverride && amount < plan.price) {
    return { valid: false, error: "Payment amount is less than plan price." };
  }

  return { valid: true, requiresPayment: true };
};

export const canProcessRefund = (payment) => {
  return payment.status === 'Paid';
};
