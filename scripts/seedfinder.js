const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const DEFAULT_PASSWORD = 'Temp1234!';

// Si quieres seguir usando este vendor para carrier/admin/dispatch/drivers
const CARRIER_VENDOR_ID = '60GFkMgItDG78neSi0AU';

const usersToSeed = [
 

  // 🔥 FINDER con su propio vendor
  {
    email: 'finder2@gmail.com',
    password: DEFAULT_PASSWORD,
    firstName: 'Finder',
    lastName: 'One',
    globalRoles: ['finder'],
    vendor: {
      id: 'FINDER_VENDOR_001', // puedes cambiarlo por un ID fijo o generado
      title: 'Finder One Logistics',
      vendorType: 'finder',
      rolesArray: ['finder'],
      legalName: 'Finder One Logistics LLC',
    },
  },
];

async function createOrGetAuthUser(userData) {
  try {
    const existing = await auth.getUserByEmail(userData.email);
    console.log(`⚠️ Auth user exists: ${userData.email}`);
    return existing;
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  const created = await auth.createUser({
    email: userData.email,
    password: userData.password,
    displayName: `${userData.firstName} ${userData.lastName}`,
    emailVerified: true,
    disabled: false,
  });

  console.log(`✅ Auth user created: ${userData.email}`);
  return created;
}

async function ensureVendor(vendorData, ownerAuthUser, userData) {
  if (!vendorData?.id) return null;

  const vendorRef = db.collection('vendors').doc(vendorData.id);
  const vendorSnap = await vendorRef.get();

  const payload = {
    id: vendorData.id,
    title: vendorData.title || `${userData.firstName} ${userData.lastName}`,
    legalName:
      vendorData.legalName ||
      vendorData.title ||
      `${userData.firstName} ${userData.lastName}`,
    vendorType: vendorData.vendorType || 'finder', // 'carrier' | 'finder'
    status: 'active',
    ownerUserID: ownerAuthUser.uid,
    stripeConnectStatus: 'not_started',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await vendorRef.set(payload, { merge: true });

  if (vendorSnap.exists) {
    console.log(`⚠️ Vendor exists: ${vendorData.id}`);
  } else {
    console.log(`✅ Vendor created: ${vendorData.id}`);
  }

  return vendorData.id;
}

async function seedFirestoreUser(authUser, userData, resolvedVendorID = null) {
  const uid = authUser.uid;

  const globalRoles = Array.isArray(userData.globalRoles)
    ? userData.globalRoles
    : [];

  const userDoc = {
    id: uid,
    userID: uid,
    usersID: uid,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,

    accountType: resolvedVendorID ? 'vendor_user' : 'platform_user',

    // 🔥 modelo nuevo
    vendorIDs: resolvedVendorID ? [resolvedVendorID] : [],
    activeVendorID: resolvedVendorID || null,
    activeRole: globalRoles.length === 1 ? globalRoles[0] : null,
    globalRoles,
    rolesArray: globalRoles, // lo puedes mantener por compatibilidad

    // compat temporal
    vendorID: resolvedVendorID || null,
    role: globalRoles.length === 1 ? globalRoles[0] : null,

    mustResetPassword: true,
    isTemporaryPassword: true,
    status: 'active',

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(uid).set(userDoc, { merge: true });

  console.log(`🔥 Firestore user seeded: ${userData.email}`);
}

async function seedVendorMembership(authUser, userData, vendorID) {
  if (!vendorID) return;

  const uid = authUser.uid;
  const vendorRoles = Array.isArray(userData?.vendor?.rolesArray)
    ? userData.vendor.rolesArray
    : [];

  const membershipRef = db
    .collection('vendor_users')
    .doc(vendorID)
    .collection('users')
    .doc(uid);

  const membershipDoc = {
    id: uid,
    userID: uid,
    usersID: uid,
    vendorID,

    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,

    rolesArray: vendorRoles,
    activeRole: vendorRoles.length === 1 ? vendorRoles[0] : null,
    status: 'active',

    invitedBy: 'seed_script',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await membershipRef.set(membershipDoc, { merge: true });

  console.log(`👥 Vendor membership seeded: ${userData.email} -> ${vendorID}`);
}

async function seedUsers() {
  console.log('🚀 Starting seed...');

  for (const userData of usersToSeed) {
    const authUser = await createOrGetAuthUser(userData);

    let resolvedVendorID = null;

    if (userData.vendor?.id) {
      resolvedVendorID = await ensureVendor(userData.vendor, authUser, userData);
    }

    await seedFirestoreUser(authUser, userData, resolvedVendorID);

    if (resolvedVendorID) {
      await seedVendorMembership(authUser, userData, resolvedVendorID);
    }
  }

  console.log('🎉 Seed complete');
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });