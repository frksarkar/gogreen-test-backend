export const createReferralCode = (email: string) => {
  return email.split("@")[0] + crypto.randomUUID().substring(0, 3);
};
