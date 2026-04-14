const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const DEFAULT_PASSWORD = 'Temp1234!';

// 🔥 TU vendorID REAL
const VENDOR_ID = '60GFkMgItDG78neSi0AU';

const usersToSeed = [
  {
    email: 'superadmin@gmail.com',
    password: DEFAULT_PASSWORD,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'superadmin',
    vendorID: null,
    vendorUserID: null,
  },
  {
    email: 'admincompany1@gmail.com',
    password: DEFAULT_PASSWORD,
    firstName: 'Admin',
    lastName: 'Company1',
    role: 'admin',
    vendorID: VENDOR_ID,
    vendorUserID: null,
  },
  {
    email: 'dispatch1@gmail.com',
    password: DEFAULT_PASSWORD,
    firstName: 'Dispatch',
    lastName: 'One',
    role: 'dispatcher',
    vendorID: VENDOR_ID,
    vendorUserID: null,
  },
  {
    email: 'driver1@gmail.com',
    password: DEFAULT_PASSWORD,
    firstName: 'Driver',
    lastName: 'One',
    role: 'driver',
    vendorID: VENDOR_ID,
    vendorUserID: null,
  },
  {
    email: 'driver2@gmail.com',
    password: DEFAULT_PASSWORD,
    firstName: 'Driver',
    lastName: 'Two',
    role: 'driver',
    vendorID: VENDOR_ID,
    vendorUserID: null,
  },
  {
    email: 'driver3@gmail.com',
    password: DEFAULT_PASSWORD,
    firstName: 'Driver',
    lastName: 'Three',
    role: 'driver',
    vendorID: VENDOR_ID,
    vendorUserID: null,
  },
    {
    email: 'finder1@gmail.com',
    password: DEFAULT_PASSWORD,
    firstName: 'Finder',
    lastName: 'One',
    role: 'finder',
    vendorID: null,
    vendorUserID: null,
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

async function seedFirestoreUser(authUser, userData) {
  const uid = authUser.uid;

  const userDoc = {
    id: uid,
    userID: uid,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    vendorID: userData.vendorID ?? null,
    vendorUserID: userData.vendorUserID ?? null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(uid).set(userDoc, { merge: true });

  console.log(`🔥 Firestore user seeded: ${userData.email}`);
}

async function seedUsers() {
  console.log('🚀 Starting seed...');

  for (const userData of usersToSeed) {
    const authUser = await createOrGetAuthUser(userData);
    await seedFirestoreUser(authUser, userData);
  }

  console.log('🎉 Seed complete');
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });