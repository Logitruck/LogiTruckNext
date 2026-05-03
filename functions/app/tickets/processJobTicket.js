const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

const db = admin.firestore();

const openai = new OpenAI({
  apiKey: 'OPENAI_KEY_REMOVED',
});

const SYSTEM_PROMPT = `
You analyze logistics ticket images and extract only information that is clearly visible.

Rules:
- Do not guess missing values.
- ticketNumber and issueDate are the most important fields. Try to identify them carefully.
- If a value is not visible or not readable, return null.
- Normalize dates to YYYY-MM-DD when possible.
- Normalize times to HH:mm when possible.
- Put any additional relevant fields you detect into detectedFields.
- detectedFields should contain only fields that are actually visible in the image.
- Set needsManualReview=true if the image is blurry, incomplete, handwritten in a hard-to-read way, or if ticketNumber or issueDate are missing or uncertain.
- confidence must be a number between 0 and 1.
`;

const ticketSchema = {
  name: 'job_ticket_extraction',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ticketNumber: { type: ['string', 'null'] },
      issueDate: { type: ['string', 'null'] },

      issueTime: { type: ['string', 'null'] },
      documentType: { type: ['string', 'null'] },
      locationName: { type: ['string', 'null'] },
      rawTextSummary: { type: ['string', 'null'] },

      detectedFields: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            fieldName: { type: 'string' },
            value: { type: ['string', 'null'] },
            normalizedValue: { type: ['string', 'null'] },
            confidence: { type: ['number', 'null'] },
          },
          required: ['fieldName', 'value', 'normalizedValue', 'confidence'],
        },
      },

      confidence: { type: ['number', 'null'] },
      needsManualReview: { type: 'boolean' },
    },
    required: [
      'ticketNumber',
      'issueDate',
      'issueTime',
      'documentType',
      'locationName',
      'rawTextSummary',
      'detectedFields',
      'confidence',
      'needsManualReview',
    ],
  },
};

exports.processJobTicket = onCall(
  {
    timeoutSeconds: 120,
    region: ['us-central1'],
  },
  async (req) => {
    const auth = req.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const { channelID, projectID, jobID, ticketType, imageUrl } = req.data || {};

    if (!channelID || !projectID || !jobID || !ticketType || !imageUrl) {
      throw new HttpsError('invalid-argument', 'Missing required parameters.');
    }

    if (ticketType !== 'pickup' && ticketType !== 'delivery') {
      throw new HttpsError('invalid-argument', 'Invalid ticketType.');
    }

    const jobRef = db
      .collection('project_channels')
      .doc(channelID)
      .collection('projects')
      .doc(projectID)
      .collection('jobs')
      .doc(jobID);

    const ticketField = ticketType === 'pickup' ? 'pickupTicket' : 'deliveryTicket';

    try {
      await jobRef.set(
        {
          [ticketField]: {
            processingStatus: 'pending',
            processingError: null,
          },
        },
        { merge: true }
      );

      const response = await openai.responses.create({
        model: 'gpt-4.1',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: SYSTEM_PROMPT,
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Analyze this ${ticketType} logistics ticket. Extract ticketNumber and issueDate as priority fields, and place any other relevant visible fields into detectedFields.`,
              },
              {
                type: 'input_image',
                image_url: imageUrl,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: ticketSchema.name,
            schema: ticketSchema.schema,
            strict: true,
          },
        },
      });

      const raw = response.output_text;
      const extractedData = JSON.parse(raw);

      await jobRef.set(
        {
          [ticketField]: {
            processingStatus: 'processed',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            extractedData,
            processingError: null,
          },
        },
        { merge: true }
      );

      return {
        success: true,
        extractedData,
      };
    } catch (error) {
      console.error('🔥 processJobTicket error:', error);

      await jobRef.set(
        {
          [ticketField]: {
            processingStatus: 'failed',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processingError: error?.message || 'Unknown processing error',
          },
        },
        { merge: true }
      );

      throw new HttpsError(
        'internal',
        error?.message || 'Failed to process job ticket.'
      );
    }
  }
);