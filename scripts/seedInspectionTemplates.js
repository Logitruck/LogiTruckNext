const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const truckItems = [
  { id: 'truck_item_1', label: 'Air Compressor', order: 1, vehicleType: 'Truck' },
  { id: 'truck_item_2', label: 'Air Lines', order: 2, vehicleType: 'Truck' },
  { id: 'truck_item_3', label: 'Battery', order: 3, vehicleType: 'Truck' },
  { id: 'truck_item_4', label: 'Belts and Hoses', order: 4, vehicleType: 'Truck' },
  { id: 'truck_item_5', label: 'Body', order: 5, vehicleType: 'Truck' },
  { id: 'truck_item_6', label: 'Brake Accessories', order: 6, vehicleType: 'Truck' },
  { id: 'truck_item_7', label: 'Brake Parking', order: 7, vehicleType: 'Truck' },
  { id: 'truck_item_8', label: 'Brake Services', order: 8, vehicleType: 'Truck' },
  { id: 'truck_item_9', label: 'Clutch', order: 9, vehicleType: 'Truck' },
  { id: 'truck_item_10', label: 'Coupling Devices', order: 10, vehicleType: 'Truck' },
  { id: 'truck_item_11', label: 'Defroster/Heater', order: 11, vehicleType: 'Truck' },
  { id: 'truck_item_12', label: 'Drive Line', order: 12, vehicleType: 'Truck' },
  { id: 'truck_item_13', label: 'Engine', order: 13, vehicleType: 'Truck' },
  { id: 'truck_item_14', label: 'Exhaust', order: 14, vehicleType: 'Truck' },
  { id: 'truck_item_15', label: 'Fifth Wheel', order: 15, vehicleType: 'Truck' },
  { id: 'truck_item_16', label: 'Fluid Levels', order: 16, vehicleType: 'Truck' },
  { id: 'truck_item_17', label: 'Frame and Assembly', order: 17, vehicleType: 'Truck' },
  { id: 'truck_item_18', label: 'Front Axle', order: 18, vehicleType: 'Truck' },
  { id: 'truck_item_19', label: 'Fuel Tanks', order: 19, vehicleType: 'Truck' },
  { id: 'truck_item_20', label: 'Horn', order: 20, vehicleType: 'Truck' },
  { id: 'truck_item_21', label: 'Lights', order: 21, vehicleType: 'Truck' },
  { id: 'truck_item_22', label: 'Mirrors', order: 22, vehicleType: 'Truck' },
  { id: 'truck_item_23', label: 'Muffler', order: 23, vehicleType: 'Truck' },
  { id: 'truck_item_24', label: 'Oil Pressure', order: 24, vehicleType: 'Truck' },
  { id: 'truck_item_25', label: 'Radiator', order: 25, vehicleType: 'Truck' },
  { id: 'truck_item_26', label: 'Rear End', order: 26, vehicleType: 'Truck' },
  { id: 'truck_item_27', label: 'Reflectors', order: 27, vehicleType: 'Truck' },
  { id: 'truck_item_28', label: 'Safety Equipment', order: 28, vehicleType: 'Truck' },
  { id: 'truck_item_29', label: 'Starter', order: 29, vehicleType: 'Truck' },
  { id: 'truck_item_30', label: 'Steering', order: 30, vehicleType: 'Truck' },
  { id: 'truck_item_31', label: 'Suspension System', order: 31, vehicleType: 'Truck' },
  { id: 'truck_item_32', label: 'Tire Chains', order: 32, vehicleType: 'Truck' },
  { id: 'truck_item_33', label: 'Tires', order: 33, vehicleType: 'Truck' },
  { id: 'truck_item_34', label: 'Transmission', order: 34, vehicleType: 'Truck' },
  { id: 'truck_item_35', label: 'Trip Recorder', order: 35, vehicleType: 'Truck' },
  { id: 'truck_item_36', label: 'Wheels and Rims', order: 36, vehicleType: 'Truck' },
  { id: 'truck_item_37', label: 'Windows', order: 37, vehicleType: 'Truck' },
  { id: 'truck_item_38', label: 'Windshield Wipers', order: 38, vehicleType: 'Truck' },
  { id: 'truck_item_39', label: 'Other', order: 39, vehicleType: 'Truck' },
];

const trailerItems = [
  { id: 'trailer_item_1', label: 'Brake Connections', order: 1, vehicleType: 'Trailer' },
  { id: 'trailer_item_2', label: 'Brakes', order: 2, vehicleType: 'Trailer' },
  { id: 'trailer_item_3', label: 'Coupling Devices', order: 3, vehicleType: 'Trailer' },
  { id: 'trailer_item_4', label: 'Coupling (King) Pin', order: 4, vehicleType: 'Trailer' },
  { id: 'trailer_item_5', label: 'Doors', order: 5, vehicleType: 'Trailer' },
  { id: 'trailer_item_6', label: 'Hitch', order: 6, vehicleType: 'Trailer' },
  { id: 'trailer_item_7', label: 'Landing Gear', order: 7, vehicleType: 'Trailer' },
  { id: 'trailer_item_8', label: 'Lights - All', order: 8, vehicleType: 'Trailer' },
  { id: 'trailer_item_9', label: 'Reflectors / Reflective Tape', order: 9, vehicleType: 'Trailer' },
  { id: 'trailer_item_10', label: 'Roof', order: 10, vehicleType: 'Trailer' },
  { id: 'trailer_item_11', label: 'Suspension System', order: 11, vehicleType: 'Trailer' },
  { id: 'trailer_item_12', label: 'Tarpaulin', order: 12, vehicleType: 'Trailer' },
  { id: 'trailer_item_13', label: 'Tires', order: 13, vehicleType: 'Trailer' },
  { id: 'trailer_item_14', label: 'Wheels and Rims', order: 14, vehicleType: 'Trailer' },
  { id: 'trailer_item_15', label: 'Other', order: 15, vehicleType: 'Trailer' },
];

const combinedItems = [
  ...truckItems.map(item => ({
    ...item,
    combinedOrder: item.order,
  })),
  ...trailerItems.map(item => ({
    ...item,
    combinedOrder: truckItems.length + item.order,
  })),
].sort((a, b) => a.combinedOrder - b.combinedOrder);

async function seedInspectionTemplates() {
  console.log('🚀 Seeding inspection templates...');

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const truckRef = db.collection('inspection_templates').doc('truck_default');
  batch.set(
    truckRef,
    {
      id: 'truck_default',
      templateType: 'vehicle',
      vehicleType: 'Truck',
      mode: 'separate',
      title: 'Generic Truck Inspection',
      isActive: true,
      version: 2,
      items: truckItems,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  const trailerRef = db.collection('inspection_templates').doc('trailer_default');
  batch.set(
    trailerRef,
    {
      id: 'trailer_default',
      templateType: 'vehicle',
      vehicleType: 'Trailer',
      mode: 'separate',
      title: 'Generic Trailer Inspection',
      isActive: true,
      version: 2,
      items: trailerItems,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  const combinedRef = db.collection('inspection_templates').doc('combined_default');
  batch.set(
    combinedRef,
    {
      id: 'combined_default',
      templateType: 'combined',
      vehicleType: 'Mixed',
      mode: 'combined',
      title: 'Generic Combined Truck + Trailer Inspection',
      isActive: true,
      version: 2,
      items: combinedItems,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  await batch.commit();

  console.log('✅ Inspection templates seeded successfully');
}

seedInspectionTemplates()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });