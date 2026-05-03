const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();
const auth = getAuth();

const TEMP_PASSWORD = 'Temp1234!';

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const normalizeRoles = (rolesArray = []) => {
  const validRoles = ['carrier', 'dispatch', 'driver'];
  const normalized = Array.isArray(rolesArray)
    ? rolesArray
        .map((role) => String(role || '').trim().toLowerCase())
        .filter((role) => validRoles.includes(role))
    : [];

  return [...new Set(normalized)];
};

const mergeUnique = (arrA = [], arrB = []) => {
  return [...new Set([...(arrA || []), ...(arrB || [])])];
};

const getUserByEmailSafe = async (email) => {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
};

exports.createVendorUser = onCall(async (request) => {
  try {
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    const {
      vendorID,
      firstName = '',
      lastName = '',
      email,
      phoneNumber = '',
      rolesArray = [],
    } = request.data || {};

    const cleanVendorID = String(vendorID || '').trim();
    const cleanEmail = normalizeEmail(email);
    const cleanFirstName = String(firstName || '').trim();
    const cleanLastName = String(lastName || '').trim();
    const cleanPhoneNumber = String(phoneNumber || '').trim();
    const cleanRoles = normalizeRoles(rolesArray);

    if (!cleanVendorID) {
      throw new HttpsError('invalid-argument', 'vendorID is required.');
    }

    if (!cleanEmail) {
      throw new HttpsError('invalid-argument', 'email is required.');
    }

    if (!cleanFirstName) {
      throw new HttpsError('invalid-argument', 'firstName is required.');
    }

    if (cleanRoles.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'rolesArray must contain at least one valid role.',
      );
    }

    // 1. validar que el vendor exista
    const vendorRef = db.collection('vendors').doc(cleanVendorID);
    const vendorSnap = await vendorRef.get();

    if (!vendorSnap.exists) {
      throw new HttpsError('not-found', 'Vendor not found.');
    }

    // 2. buscar usuario global por email
    let authUser = await getUserByEmailSafe(cleanEmail);
    let isNewAuthUser = false;

    if (!authUser) {
      authUser = await auth.createUser({
        email: cleanEmail,
        password: TEMP_PASSWORD,
        displayName: `${cleanFirstName} ${cleanLastName}`.trim(),
        disabled: false,
      });

      isNewAuthUser = true;
    }

    const uid = authUser.uid;

    // 3. users/{uid}
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const existingUserData = userSnap.exists ? userSnap.data() : {};

    const mergedVendorIDs = mergeUnique(existingUserData?.vendorIDs || [], [
      cleanVendorID,
    ]);

    const existingGlobalRoles = Array.isArray(existingUserData?.globalRoles)
      ? existingUserData.globalRoles
      : Array.isArray(existingUserData?.rolesArray)
      ? existingUserData.rolesArray
      : [];

    const mergedGlobalRoles = mergeUnique(existingGlobalRoles, cleanRoles);

    const userPayload = {
      id: uid,
      userID: uid,
      email: cleanEmail,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phoneNumber: cleanPhoneNumber || existingUserData?.phoneNumber || '',
      vendorIDs: mergedVendorIDs,
      activeVendorID: existingUserData?.activeVendorID || cleanVendorID,
      globalRoles: mergedGlobalRoles,
      rolesArray: mergedGlobalRoles, // espejo temporal para compatibilidad
      accountType: 'vendor_user',
      mustResetPassword: true,
      isTemporaryPassword: true,
      status: 'active',
      activeJob: existingUserData?.activeJob || null,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: existingUserData?.createdAt || FieldValue.serverTimestamp(),
    };

    await userRef.set(userPayload, { merge: true });

    // 4. vendor_users/{vendorID}/users/{uid}
    const vendorUserRef = db
      .collection('vendor_users')
      .doc(cleanVendorID)
      .collection('users')
      .doc(uid);

    const vendorUserSnap = await vendorUserRef.get();
    const existingVendorUserData = vendorUserSnap.exists
      ? vendorUserSnap.data()
      : {};

    const mergedVendorRoles = mergeUnique(
      existingVendorUserData?.rolesArray || [],
      cleanRoles,
    );

    const vendorUserPayload = {
      id: uid,
      userID: uid,
      usersID: uid,
      vendorID: cleanVendorID,
      email: cleanEmail,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phoneNumber: cleanPhoneNumber || existingVendorUserData?.phoneNumber || '',
      rolesArray: mergedVendorRoles,
      status: 'active',
      invitedBy: callerUid,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt:
        existingVendorUserData?.createdAt || FieldValue.serverTimestamp(),
    };

    await vendorUserRef.set(vendorUserPayload, { merge: true });

    // 5. custom claims opcionalmente no los tocaría todavía
    // porque el usuario puede pertenecer a varias empresas y los roles son contextuales.

    return {
      success: true,
      uid,
      email: cleanEmail,
      vendorID: cleanVendorID,
      isNewAuthUser,
      tempPassword: isNewAuthUser ? TEMP_PASSWORD : null,
      globalRoles: mergedGlobalRoles,
      vendorRoles: mergedVendorRoles,
      message: isNewAuthUser
        ? 'User created and linked to vendor successfully.'
        : 'Existing user linked/updated successfully for vendor.',
    };
  } catch (error) {
    console.error('❌ createVendorUser error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      error?.message || 'Failed to create vendor user.',
    );
  }
});