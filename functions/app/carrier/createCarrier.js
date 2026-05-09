const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');
const { getUserByEmailSafe } = require('../../core/user');

const db = getFirestore();
const auth = getAuth();

exports.createCarrier = onCall(async (request) => {
  try {
    // 1. Auth check — first statement
    const authUID = request.auth?.uid;
    if (!authUID) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // 2. Input validation
    const { companyName, adminEmail, adminFirstName, adminLastName = '' } =
      request.data || {};

    if (!companyName) {
      throw new HttpsError('invalid-argument', 'companyName is required');
    }

    if (!adminEmail) {
      throw new HttpsError('invalid-argument', 'adminEmail is required');
    }

    if (!adminFirstName) {
      throw new HttpsError('invalid-argument', 'adminFirstName is required');
    }

    const cleanCompanyName = String(companyName).trim();
    const cleanAdminEmail = String(adminEmail).trim().toLowerCase();
    const cleanAdminFirstName = String(adminFirstName).trim();
    const cleanAdminLastName = String(adminLastName).trim();

    // 3. Generate vendorID
    const vendorID = uuidv4();

    // 4. Write vendors/{vendorID}
    const vendorRef = db.collection('vendors').doc(vendorID);
    await vendorRef.set({
      vendorID,
      name: cleanCompanyName,
      searchKeywords: [cleanCompanyName.toLowerCase()],
      serviceCategoryIDs: [],
      status: 'active',
      createdBy: authUID,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 5. Check for existing user by email (idempotency)
    let authUser = await getUserByEmailSafe(cleanAdminEmail);

    // 6. Create Firebase Auth user if new
    if (!authUser) {
      const displayName = `${cleanAdminFirstName} ${cleanAdminLastName}`.trim();
      authUser = await auth.createUser({
        email: cleanAdminEmail,
        displayName,
      });
    }

    const uid = authUser.uid;

    // 7. Write users/{uid}
    const userRef = db.collection('users').doc(uid);
    await userRef.set(
      {
        id: uid,
        email: cleanAdminEmail,
        firstName: cleanAdminFirstName,
        lastName: cleanAdminLastName,
        vendorID,
        role: 'carrier',
        rolesArray: ['carrier'],
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // 8. Write vendor_users/{vendorID}/users/{uid}
    const vendorUserRef = db
      .collection('vendor_users')
      .doc(vendorID)
      .collection('users')
      .doc(uid);
    await vendorUserRef.set(
      {
        id: uid,
        email: cleanAdminEmail,
        firstName: cleanAdminFirstName,
        lastName: cleanAdminLastName,
        vendorID,
        role: 'carrier',
        rolesArray: ['carrier'],
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // 9. Return success
    return {
      success: true,
      vendorID,
      adminUID: uid,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      'internal',
      error?.message || 'Failed to create carrier',
    );
  }
});
