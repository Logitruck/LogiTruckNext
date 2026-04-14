const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const DEFAULT_PASSWORD = 'Temp1234!';

// 🔑 Categorías reales (las que ya tienes en Firestore)
const CATEGORY_IDS = {
  flatBed: '5CKKuTSOHUN8XnnlVfmL',
  liveFloor: 'cZCzZXiC1C68RYmXAxRs',
};

const vendorsToSeed = [
  {
    email: 'vendor.tampa@gmail.com',
    name: 'Tampa Freight LLC',
    lat: 27.9755,
    lng: -82.5332,
    label: 'Near Tampa International Airport, Tampa, FL',
    maxDistance: 120,
  },
  {
    email: 'vendor.orlando@gmail.com',
    name: 'Orlando Cargo Transport',
    lat: 28.4312,
    lng: -81.3081,
    label: 'Near Orlando International Airport, Orlando, FL',
    maxDistance: 120,
  },
  {
    email: 'vendor.fll@gmail.com',
    name: 'South Florida Hauling',
    lat: 26.0726,
    lng: -80.1527,
    label: 'Near Fort Lauderdale Airport, FL',
    maxDistance: 120,
  },
  {
    email: 'vendor.plantcity@gmail.com',
    name: 'Plant City Materials',
    lat: 28.0186323,
    lng: -82.1128641,
    label: 'Plant City, Florida, EE. UU.',
    maxDistance: 80,
  },
];

async function createOrGetAuthUser(email, name) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`⚠️ Auth exists: ${email}`);
    return existing;
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
  }

  const user = await auth.createUser({
    email,
    password: DEFAULT_PASSWORD,
    displayName: name,
    emailVerified: true,
  });

  console.log(`✅ Auth created: ${email}`);
  return user;
}

async function seedVendor(vendorData) {
  const authUser = await createOrGetAuthUser(
    vendorData.email,
    vendorData.name
  );

  const uid = authUser.uid;

  const categoryArray = [
    { label: 'Flat Bed', value: CATEGORY_IDS.flatBed },
    { label: 'Live Floor', value: CATEGORY_IDS.liveFloor },
  ];

  const categoryIDs = [
    CATEGORY_IDS.flatBed,
    CATEGORY_IDS.liveFloor,
  ];

  // 🔥 USERS
  await db.collection('users').doc(uid).set(
    {
      id: uid,
      userID: uid,
      email: vendorData.email,
      firstName: vendorData.name,
      role: 'vendor',
      vendorID: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 🔥 VENDORS (CLAVE PARA TU QUERY)
  await db.collection('vendors').doc(uid).set(
    {
      id: uid,
      email: vendorData.email,
      title: vendorData.name,
      status: 'Active',

      location: {
        label: vendorData.label,
        location: {
          lat: vendorData.lat,
          lng: vendorData.lng,
        },
      },

      serviceCategory: categoryArray,
      serviceCategoryIDs: categoryIDs, // 🔥 ESTE ES EL CRÍTICO
      serviceLabels: ['Transport'],

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 🔥 ROOT vendor_locations
  await db.collection('vendor_locations').doc(uid).set(
    {
      vendorID: uid,
      vendorName: vendorData.name,
    },
    { merge: true }
  );

  // 🔥 LOCATION (CLAVE PARA DISTANCIA)
  await db
    .collection('vendor_locations')
    .doc(uid)
    .collection('locations')
    .doc('main')
    .set(
      {
        description: 'principal',
        name: 'main point',
        locationID: 'main',
        vendorID: uid,

        maxDistanceService: vendorData.maxDistance,

        location: {
          label: vendorData.label,
          location: {
            lat: vendorData.lat,
            lng: vendorData.lng,
          },
        },

        vendor: {
          id: uid,
          email: vendorData.email,
          title: vendorData.name,
        },

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log(`🔥 Vendor seeded: ${vendorData.name}`);
}

async function seedVendors() {
  console.log('🚀 Seeding vendors...');

  for (const vendor of vendorsToSeed) {
    await seedVendor(vendor);
  }

  console.log('🎉 Vendors seed complete');
}

seedVendors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });