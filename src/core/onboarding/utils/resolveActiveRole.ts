export const resolveActiveRole = (vendorUser: any, user: any) => {
  const vendorRoles = Array.isArray(vendorUser?.rolesArray)
    ? vendorUser.rolesArray
    : [];

  if (
    vendorUser?.activeRole &&
    vendorRoles.includes(vendorUser.activeRole)
  ) {
    return vendorUser.activeRole;
  }

  if (user?.activeRole && vendorRoles.includes(user.activeRole)) {
    return user.activeRole;
  }

  if (vendorRoles.length === 1) {
    return vendorRoles[0];
  }

  return null;
};