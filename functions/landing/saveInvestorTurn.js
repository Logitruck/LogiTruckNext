const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

exports.saveLogiTruckInvestorTurn = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({
          ok: false,
          error: 'Method not allowed',
        });
      }

      const {
        sessionId,
        role,
        text,
        source = 'logitruck-investor-landing',
        timestamp,
      } = req.body || {};

      if (!sessionId || !role || !text) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: sessionId, role, text',
        });
      }

      const sessionRef = db
        .collection('logitruck_investor_agent_sessions')
        .doc(sessionId);

      await sessionRef.set(
        {
          id: sessionId,
          source,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      await sessionRef.collection('turns').add({
        role,
        text,
        source,
        clientTimestamp: timestamp || Date.now(),
        createdAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        ok: true,
        sessionId,
      });
    } catch (error) {
      console.error('saveLogiTruckInvestorTurn error:', error);

      return res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  },
);
