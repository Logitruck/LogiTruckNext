const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const { getUserByEmailSafe } = require('../../core/user');

const db = admin.firestore();

exports.createCarrier = onCall(async (request) => {
  // 1. Auth check — first statement
  const authUID = request.auth?.uid;
  if (!authUID) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // 2. Input validation
  const { companyName, adminEmail, adminFirstName, adminLastName } = request.data;

  if (!companyName) {
    throw new HttpsError('invalid-argument', 'companyName is required');
  }
  if (!adminEmail) {
    throw new HttpsError('invalid-argument', 'adminEmail is required');
  }
  if (!adminFirstName) {
    throw new HttpsError('invalid-argument', 'adminFirstName is required');
  }

  try {
    // 3. Generate vendorID
    const vendorID = uuidv4();

    // 4. Write vendors/{vendorID}
    await db.collection('vendors').doc(vendorID).set({
      vendorID,
      name: companyName,
      searchKeywords: [companyName.toLowerCase()],
      serviceCategoryIDs: [],
      status: 'active',
      createdBy: authUID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Check if user exists via email (idempotency guard)
    let adminUID;
    const existingUser = await getUserByEmailSafe(adminEmail);

    if (existingUser) {
      // Reuse existing Firebase Auth user
      adminUID = existingUser.uid;
    } else {
      // 6. Create new Firebase Auth user
      const displayName = adminLastName
        ? `${adminFirstName} ${adminLastName}`
        : adminFirstName;

      const newUser = await admin.auth().createUser({
        email: adminEmail,
        displayName,
      });
      adminUID = newUser.uid;
    }

    // 7. Write users/{uid} with merge:true
    await db.collection('users').doc(adminUID).set(
      {
        id: adminUID,
        email: adminEmail,
        firstName: adminFirstName,
        lastName: adminLastName || '',
        vendorID,
        role: 'carrier',
        rolesArray: ['carrier'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 8. Write vendor_users/{vendorID}/users/{uid} with merge:true
    await db
      .collection('vendor_users')
      .doc(vendorID)
      .collection('users')
      .doc(adminUID)
      .set(
        {
          id: adminUID,
          email: adminEmail,
          firstName: adminFirstName,
          lastName: adminLastName || '',
          role: 'carrier',
          rolesArray: ['carrier'],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // 9. Return result
    return {
      success: true,
      vendorID,
      adminUID,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to create carrier: ${error.message}`);
  }
});
