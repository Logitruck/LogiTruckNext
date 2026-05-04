const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { OpenAI } = require('openai');

const db = getFirestore();
const openAIKey = defineSecret('OPENAI_API_KEY');

exports.finalizeInvestorSession = onRequest(
  { cors: true, timeoutSeconds: 120, secrets: [openAIKey] },
  async (req, res) => {
    const openai = new OpenAI({ apiKey: openAIKey.value() });
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
      }

      const { sessionId } = req.body || {};

      if (!sessionId) {
        return res.status(400).json({ ok: false, error: 'Missing required field: sessionId' });
      }

      const turnsSnap = await db
        .collection('logitruck_investor_agent_sessions')
        .doc(sessionId)
        .collection('turns')
        .orderBy('clientTimestamp', 'asc')
        .get();

      if (turnsSnap.empty) {
        return res.status(404).json({ ok: false, error: 'No turns found for this session' });
      }

      const dialogue = turnsSnap.docs
        .map((doc) => {
          const { role, text } = doc.data();
          return `${role === 'assistant' ? 'Agent' : 'User'}: ${text}`;
        })
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `You are an analyst extracting structured data from an investor briefing conversation.
Return a valid JSON object with exactly these fields:
{
  "name": string or null,
  "email": string or null,
  "phone": string or null,
  "interestLevel": number between 1 and 10,
  "mainObjections": array of up to 3 strings,
  "suggestedNextSteps": array of up to 3 strings
}
Only include information explicitly stated in the conversation. Use null for fields not found.`,
          },
          {
            role: 'user',
            content: `Analyze this investor briefing conversation:\n\n${dialogue}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const analysisData = JSON.parse(completion.choices[0].message.content);

      const sessionRef = db
        .collection('logitruck_investor_agent_sessions')
        .doc(sessionId);

      const analysisRef = await sessionRef.collection('analysis').add({
        ...analysisData,
        sessionId,
        model: 'gpt-4o',
        turnCount: turnsSnap.size,
        createdAt: FieldValue.serverTimestamp(),
      });

      await sessionRef.set(
        { hasAnalysis: true, analyzedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );

      return res.status(200).json({ ok: true, analysisId: analysisRef.id });
    } catch (error) {
      console.error('finalizeInvestorSession error:', error);
      return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
    }
  },
);
