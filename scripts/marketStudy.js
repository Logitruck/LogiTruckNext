const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedMarketStudy() {
  const docRef = db
    .collection('logitruck_public_context')
    .doc('market_study_v1');

  await docRef.set(
{
  version: "market_study_v1",
  status: "approved",

  industryOverview: {
    description:
      "The logistics industry, particularly freight transportation, is highly fragmented and operationally inefficient, relying heavily on manual coordination, brokers, and disconnected systems.",
    sizeEstimate:
      "The U.S. freight and logistics market exceeds $800B annually, with significant inefficiencies in mid-mile and last-mile coordination.",
    fragmentation:
      "Most carriers are small to mid-sized operators with limited technology adoption and heavy reliance on brokers.",
    keyProblem:
      "Coordination between supply (carriers) and demand (shippers) is still human-intensive, slow, and expensive."
  },

  targetSegments: {
    carriers:
      "Small and mid-sized fleet operators that need operational tools and access to consistent demand.",
    shippers:
      "Companies that move freight and require reliable execution, visibility, and cost control.",
    finders:
      "Independent actors (dispatchers, brokers, or sales agents) who can generate demand and connect loads with carriers."
  },

  competitorLandscape: {
    traditionalBrokers: [
      "C.H. Robinson",
      "Total Quality Logistics (TQL)",
      "XPO Logistics"
    ],
    digitalFreightPlatforms: [
      "Uber Freight",
      "Convoy",
      "Loadsmart"
    ],
    fleetManagementSaaS: [
      "Samsara",
      "Motive (KeepTruckin)",
      "Geotab"
    ],
    limitations:
      "Most platforms focus either on marketplace transactions or operational tools, but rarely integrate both with financial infrastructure and AI-driven execution."
  },

  marketGaps: [
    "Lack of integrated systems combining operations, marketplace, communication, and payments",
    "High dependency on human coordination and manual workflows",
    "Limited scalability of traditional brokerage models",
    "Fragmented data across multiple systems with no unified execution layer"
  ],

  trends: [
    "Shift toward digital freight platforms",
    "Increasing adoption of telematics and fleet SaaS",
    "Emergence of AI in operations and automation",
    "Demand for real-time visibility and tracking"
  ],

  whyNow: [
    "AI can now automate operational workflows, not just analytics",
    "Cloud infrastructure allows scalable multi-party coordination",
    "Embedded finance enables direct monetization of logistics flows",
    "Market is ready for consolidation through integrated platforms"
  ],

  logitruckPositioning: {
    category:
      "AI-native logistics network platform combining operations, marketplace, and financial infrastructure",
    differentiation:
      "LogiTruck starts with carriers through operational tools, activates demand through finders, and scales into a marketplace with embedded payments and AI-driven execution.",
    strategicAdvantage:
      "By avoiding early marketplace dependency and focusing on operational adoption first, LogiTruck reduces cold-start risk and builds network liquidity progressively."
  },

  risks: [
    "Marketplace liquidity requires critical mass of carriers and demand",
    "Competition from established digital freight platforms",
    "Adoption friction in traditional logistics operators"
  ],

  opportunities: [
    "Massive fragmented market with low digital penetration",
    "Ability to scale with network effects once liquidity is reached",
    "AI-driven operational efficiency reduces cost to serve",
    "Embedded finance opens additional revenue streams"
  ]

  });

  console.log("✅ Market study seeded");
}

seedMarketStudy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });