const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.getLogiTruckInvestorContext = onRequest(
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
        .doc('investor_v1')
        .get();

      if (!snap.exists) {
        return res.status(404).json({
          ok: false,
          error: 'Investor context not found',
        });
      }

      const context = snap.data();

      if (context.status !== 'approved') {
        return res.status(403).json({
          ok: false,
          error: 'Investor context is not approved',
        });
      }

      return res.status(200).json({
        ok: true,
        context,
      });
    } catch (error) {
      console.error('getLogiTruckInvestorContext error:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  },
);