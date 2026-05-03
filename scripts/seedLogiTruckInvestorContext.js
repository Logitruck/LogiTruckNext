const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const context = {
  version: 'investor_v1',
  status: 'approved',

  companySummary: {
    oneLiner:
      'LogiTruck is building a network-driven logistics platform connecting carriers, finders, and shippers.',
    shortDescription:
      'LogiTruck combines operational tools, marketplace dynamics, AI-assisted execution, contextual communication, and embedded payments to enable a scalable logistics network.',
    category: 'Network-enabled logistics execution platform',
  },

  coreThesis: {
    mainThesis:
      'LogiTruck starts with carrier adoption, activates demand through finders, creates marketplace liquidity, brings shippers into a trusted execution network, and scales through network effects.',
    strategicSequence:
      'Carrier adoption → Finder demand → Marketplace liquidity → Shipper trust → Network scale.',
    positioning:
      'LogiTruck is not only a SaaS tool and not only a marketplace. It uses operational tools as the adoption layer and marketplace activity as the growth engine.',
  },

  actors: {
    carriers:
      'Carriers are the initial entry point. They use operational tools to manage fleet, jobs, documents, contracts, communication, and execution while activating their own demand network.',
    finders:
      'Finders help generate distributed demand by bringing load opportunities, referrals, and commercial connections into the platform.',
    shippers:
      'Shippers join once the network shows real execution, trusted capacity, visibility, and operational control.',
  },

  goToMarket: {
    phaseOneEntry:
      'The first phase starts with carriers, not with marketplace volume.',
    carrierStrategy:
      'Carriers receive immediate value through operational tools and digital presence, even before marketplace liquidity is fully developed.',
    finderStrategy:
      'Finders are activated through referral incentives and demand generation opportunities.',
    shipperStrategy:
      'Shippers are approached once LogiTruck can show a more reliable execution network with active carriers and structured workflows.',
    coldStartMitigation:
      'The model reduces marketplace cold-start risk by using SaaS-like operational tools to onboard carriers before scaling marketplace activity.',
  },

  revenueModel: {
    fleetManagementSaaS:
      'Fleet management SaaS provides a recurring revenue foundation.',
    referralCommissions:
      'Referral and commission incentives help activate distributed demand and organic network expansion.',
    marketplaceTransactions:
      'Marketplace transaction revenue grows as more loads, carriers, finders, and shippers interact through the platform.',
    embeddedPayments:
      'Embedded payments create opportunities for commission capture, reconciliation, payouts, and transaction monetization.',
  },

  currentStatus: {
    productStatus:
      'The product is built and includes core operational workflows.',
    tractionStatus:
      'Approved context does not currently claim revenue, paying customers, or funding raised.',
    currentFocus:
      'The current focus is onboarding initial carriers, validating the model, and creating early network liquidity.',
    nextMilestone:
      'The next milestone is to validate carrier adoption, finder-driven demand generation, and early structured transactions.',
  },

  forbiddenClaims: [
    'Do not claim current revenue unless explicitly provided.',
    'Do not claim paying customers unless explicitly provided.',
    'Do not claim funding raised unless explicitly provided.',
    'Do not claim market size numbers unless explicitly provided.',
    'Do not claim partnerships unless explicitly provided.',
    'Do not claim regulatory approvals unless explicitly provided.',
    'Do not claim guaranteed exponential growth.',
  ],

  fallbackRules: {
    unknownAnswer:
      'I don’t have enough approved information to answer that accurately.',
    tractionAnswer:
      'The product is built and the current focus is onboarding initial companies, validating the model, and building early network liquidity.',
    pricingAnswer:
      'Pricing has not been finalized in the approved investor context.',
  },

  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function seedLogiTruckInvestorContext() {
  console.log('🚀 Seeding LogiTruck investor context...');

  await db
    .collection('logitruck_public_context')
    .doc('investor_v1')
    .set(context, { merge: true });

  console.log('✅ Context seeded at logitruck_public_context/investor_v1');
}

seedLogiTruckInvestorContext()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });