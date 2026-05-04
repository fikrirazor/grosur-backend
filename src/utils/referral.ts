export const generateReferralCode = (email: string): string => {
  const prefix = email.split("@")[0].substring(0, 3).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${randomStr}`;
};
