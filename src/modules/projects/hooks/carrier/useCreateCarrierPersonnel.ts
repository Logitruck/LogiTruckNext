import { getFunctions, httpsCallable } from 'firebase/functions';

type CreateCarrierPersonnelParams = {
  vendorID: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  email: string;
  rolesArray: string[];
};

const useCreateCarrierPersonnel = () => {
  const createPersonnel = async ({
    vendorID,
    firstName,
    lastName = '',
    phoneNumber = '',
    email,
    rolesArray,
  }: CreateCarrierPersonnelParams) => {
    const functions = getFunctions();
    const createVendorUser = httpsCallable(functions, 'createVendorUser');

    const response: any = await createVendorUser({
      vendorID,
      firstName,
      lastName,
      phoneNumber,
      email,
      rolesArray,
    });

    const result = response?.data || {};

    return {
      success: !!result?.success,
      uid: result?.uid,
      email: result?.email,
      vendorID: result?.vendorID,
      isNewAuthUser: !!result?.isNewAuthUser,
      tempPassword: result?.tempPassword || null,
      globalRoles: result?.globalRoles || [],
      vendorRoles: result?.vendorRoles || [],
      message: result?.message || '',
      person: {
        id: result?.uid,
        userID: result?.uid,
        usersID: result?.uid,
        vendorID: result?.vendorID,
        firstName,
        lastName,
        phoneNumber,
        email,
        rolesArray: result?.vendorRoles || rolesArray,
        status: 'active',
      },
    };
  };

  return { createPersonnel };
};

export default useCreateCarrierPersonnel;