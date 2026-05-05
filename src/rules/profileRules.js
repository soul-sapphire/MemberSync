export const REQUIRED_PROFILE_FIELDS = [
  'fullName',
  'email',
  'phone',
  'address',
  'planName',
  'joinDate'
];

export const calculateProfileCompletion = (member) => {
  if (!member) return 0;
  
  const filledFields = REQUIRED_PROFILE_FIELDS.filter(field => {
    const value = member[field];
    return value !== undefined && value !== null && value !== '';
  }).length;

  const percentage = (filledFields / REQUIRED_PROFILE_FIELDS.length) * 100;
  
  return {
    percentage: Math.round(percentage),
    isComplete: percentage >= 100, // Or use a lower threshold if needed
    missingFields: REQUIRED_PROFILE_FIELDS.filter(field => !member[field])
  };
};

export const validateMemberData = (member) => {
  const errors = [];
  
  if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    errors.push("Invalid email format");
  }

  if (member.joinDate && member.expiryDate) {
    if (new Date(member.expiryDate) <= new Date(member.joinDate)) {
      errors.push("Expiry date must be after join date");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
