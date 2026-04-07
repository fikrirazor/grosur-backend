export const checkRole = (
  userRole: string | undefined,
  allowedRoles: string[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};
