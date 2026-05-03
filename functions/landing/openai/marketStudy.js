const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.getLogiTruckMarketStudy = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({
          ok: false,
          error: 'Method not allowed',
        });
      }

      const snap = await db
        .collection('logitruck_public_context')
        .doc('market_study_v1')
        .get();

      if (!snap.exists) {
        return res.status(404).json({
          ok: false,
          error: 'Market study not found',
        });
      }

      const marketStudy = snap.data();

      if (marketStudy.status !== 'approved') {
        return res.status(403).json({
          ok: false,
          error: 'Market study is not approved',
        });
      }

      return res.status(200).json({
        ok: true,
        marketStudy,
      });
    } catch (error) {
      console.error('getLogiTruckMarketStudy error:', error);

      return res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  },
);