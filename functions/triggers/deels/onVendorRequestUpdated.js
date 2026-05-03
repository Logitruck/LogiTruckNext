const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');

const db = admin.firestore();

exports.onVendorRequestUpdated = onDocumentUpdated(
  'vendor_requests/{vendorID}/requests/{requestID}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const { vendorID, requestID } = event.params;

    if (!before || !after || !requestID || !vendorID) return;

    const oldStatus = before.status;
    const newStatus = after.status;
    const oldContract = before.contract_status;
    const newContract = after.contract_status;

    const requestRef = db.collection('requests').doc(requestID);

    try {
      const requestSnap = await requestRef.get();
      const requestData = requestSnap.data();

      if (!requestData) {
        logger.error(`❌ Request ${requestID} not found.`);
        return;
      }

      const isConfirmedVendor = requestData?.confirmedVendor === vendorID;

      if (oldStatus !== newStatus) {
        logger.info(
          `📡 vendor_request ${vendorID}/${requestID} status changed: ${oldStatus} → ${newStatus}`
        );

        switch (newStatus) {
          case 'offered':
            if (requestData?.status === 'sending') {
              await requestRef.update({
                status: 'offered',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info(`✅ Request ${requestID} status set to 'offered'`);
            }
            break;

          case 'rejected':
          case 'cancelled': {
            const offeredSnapshot = await db
              .collectionGroup('requests')
              .where('requestID', '==', requestID)
              .where('status', '==', 'offered')
              .get();

            const requestStillOpen =
              !requestData?.confirmedVendor &&
              ['sending', 'offered'].includes(requestData?.status);

            if (offeredSnapshot.empty && requestStillOpen) {
              await requestRef.update({
                status: 'sending',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info(
                `⚠️ No active offers remain. Request ${requestID} restored to 'sending'.`
              );
            }
            break;
          }

          case 'accepted':
            if (isConfirmedVendor && requestData?.status !== 'accepted') {
              await requestRef.update({
                status: 'accepted',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info(`✅ Request ${requestID} status set to 'accepted'`);
            }
            break;

          case 'to_sign':
            if (isConfirmedVendor && requestData?.status !== 'to_sign') {
              await requestRef.update({
                status: 'to_sign',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info(`✍️ Request ${requestID} status set to 'to_sign'`);
            }
            break;

          case 'execution':
            if (isConfirmedVendor && requestData?.status !== 'execution') {
              await requestRef.update({
                status: 'execution',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info(`🚚 Request ${requestID} status set to 'execution'`);
            }
            break;

          case 'closed':
            logger.info(`📦 vendor_request ${vendorID}/${requestID} closed.`);
            break;

          case 'signed':
            logger.info(
              `📝 Carrier signed contract for request ${requestID}. Waiting for final sync.`
            );
            break;

          default:
            logger.info(
              `ℹ️ No sync rule defined for vendor_request status "${newStatus}".`
            );
            break;
        }
      }

      if (oldContract !== newContract) {
        logger.info(
          `📡 vendor_request ${vendorID}/${requestID} contract_status changed: ${oldContract} → ${newContract}`
        );

        if (!isConfirmedVendor) {
          logger.warn(
            `⚠️ Vendor ${vendorID} is not confirmed for request ${requestID}`
          );
          return;
        }

        if (requestData.contract_status === 'signed') {
          logger.info(
            `🚫 Request ${requestID} already signed, skipping contract_status update.`
          );
          return;
        }

        switch (newContract) {
          case 'send_documents':
            await requestRef.update({
              contract_status: 'review_documents',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info(
              `📨 Request ${requestID} contract_status set to 'review_documents'`
            );
            break;

          case 'signed':
            logger.info(
              `📝 Carrier contract signed for request ${requestID}. Waiting for final signature sync.`
            );
            break;

          default:
            logger.info(
              `ℹ️ No sync rule defined for contract_status "${newContract}".`
            );
            break;
        }
      }
    } catch (err) {
      logger.error('🔥 Error in onVendorRequestUpdated:', err);
    }
  }
);