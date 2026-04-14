const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const VENDOR_ID = 'InsaBb5D4KTCxlnItMrjB7oHp3u1';

async function seedVendorInspectionSettings() {
  console.log(`🚀 Seeding inspection settings for vendor ${VENDOR_ID}...`);

  const now = admin.firestore.FieldValue.serverTimestamp();

  await db
    .collection('vendor_inspection_settings')
    .doc(VENDOR_ID)
    .set(
      {
        vendorID: VENDOR_ID,

        // 🔑 Modo principal
        inspectionMode: 'combined', // 👉 puedes cambiar a 'separate'

        // 🔧 Templates asignados
        truckTemplateID: 'truck_default',
        trailerTemplateID: 'trailer_default',
        combinedTemplateID: 'combined_default',

        // ⚙️ Flags útiles a futuro
        allowTrailerOnlyInspection: true,
        allowTruckOnlyInspection: true,

        // 📊 Control
        isActive: true,
        version: 1,

        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

  console.log(`✅ Inspection settings seeded for vendor ${VENDOR_ID}`);
}

seedVendorInspectionSettings()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });