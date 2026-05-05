import { MEMBERSHIP_STATUS } from './membershipRules';

export const canApproveMember = (member) => {
  return member.status === MEMBERSHIP_STATUS.PENDING && member.profileComplete;
};

export const requiresManualApproval = (member, settings) => {
  if (settings?.autoApproveEnabled) return false;
  return true;
};
