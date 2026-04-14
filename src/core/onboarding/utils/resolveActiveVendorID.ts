export const resolveActiveVendorID = (user: any) => {
  if (user?.activeVendorID) return user.activeVendorID;

  if (Array.isArray(user?.vendorIDs) && user.vendorIDs.length > 0) {
    return user.vendorIDs[0];
  }

  if (user?.vendorID) return user.vendorID;

  return null;
};