
const { onCall, HttpsError} = require('firebase-functions/v2/https');

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const userClient = require('../../core/user');
const { fetchUser } = userClient;
const collectionsUtils = require('../../core/collections');
const { add, remove, getList, getListWithFilters, getDoc, deleteCollection } = collectionsUtils;

const db = admin.firestore();
const socialFeedsRef = db.collection('social_feeds');
const chatChannelsRef = db.collection('channels');

const { createChannel, insertMessage } = require('./utils');
const { hydrateChatFeedsForAllParticipants } = require('./utils');

function validateRequiredFields(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) {
      throw new HttpsError('invalid-argument', `${key} is required.`);
    }
  }
}

exports.createChannel = onCall(async (req) => {
  return await createChannel(req.data);
});

exports.markAsRead = onCall(async (req) => {
  const { channelID, userID, messageID, readUserIDs } = req.data;
  validateRequiredFields({ channelID, userID });

  const dedupedReadUserIDs = [...new Set(readUserIDs)];

  if (messageID) {
    const doc = await getDoc(chatChannelsRef.doc(channelID), 'messages', messageID);
    if (doc?.ref) {
      doc.ref.set({ readUserIDs }, { merge: true });
    }
  }

  const channel = await chatChannelsRef.doc(channelID).get();
  if (channel.exists) {
    chatChannelsRef.doc(channelID).set({ readUserIDs: dedupedReadUserIDs }, { merge: true });
  }

  await add(socialFeedsRef.doc(userID), 'chat_feed', { id: channelID, markedAsRead: true });
  return { success: true };
});

exports.markUserAsTypingInChannel = onCall(async (req) => {
  const { channelID, userID } = req.data;
  validateRequiredFields({ channelID, userID });

  const channel = await chatChannelsRef.doc(channelID).get();
  if (channel.exists) {
    const channelData = channel.data();
    const typingUsers = channelData?.typingUsers ?? {};
    typingUsers[userID] = { lastTypingDate: Math.floor(Date.now() / 1000) };
    chatChannelsRef.doc(channelID).set({ typingUsers }, { merge: true });
  }

  return { success: true };
});

exports.listMessages = onCall(async (req) => {
  const { channelID, page, size } = req.data;
  validateRequiredFields({ channelID });

  const messages = await getList(chatChannelsRef.doc(channelID), 'messages', page, size, true);
  return { messages: messages ?? [], success: true };
});

exports.insertMessage = onCall(async (req) => {
  return await insertMessage(req.data);
});

exports.deleteMessage = onCall(async (req) => {
  const { channelID, messageID } = req.data;
  validateRequiredFields({ channelID, messageID });

  await remove(chatChannelsRef.doc(channelID), 'messages', messageID, true);

  const live = await chatChannelsRef.doc(channelID).collection('messages_live').orderBy('createdAt', 'desc').limit(1).get();
  const hist = await chatChannelsRef.doc(channelID).collection('messages_historical').orderBy('createdAt', 'desc').limit(1).get();
  let last = live.docs[0]?.data() ?? null;
  if (hist.docs[0]) {
    const temp = hist.docs[0].data();
    if (!last || temp.createdAt > last.createdAt) last = temp;
  }

  const meta = last ? {
    lastMessage: last.content || last.media,
    lastMessageDate: last.createdAt,
    lastMessageSenderId: last.senderID,
    lastThreadMessageId: last._id,
    readUserIDs: [last.senderID],
  } : {
    lastMessage: '',
    lastMessageDate: '',
    lastMessageSenderId: '',
    lastThreadMessageId: '',
    readUserIDs: [],
  };

  await chatChannelsRef.doc(channelID).set(meta, { merge: true });
  await hydrateChatFeedsForAllParticipants(channelID, last);
  return { success: true };
});

exports.listChannels = onCall(async (req) => {
  const { userID, page, size } = req.data;
  validateRequiredFields({ userID });

  const channels = await getList(
    socialFeedsRef.doc(userID),
    'chat_feed',
    page,
    size,
    true,
  );
  return { channels: channels ?? [], success: true };
});



exports.listChannelsWithFilters = onCall(async (req, context) => {
  const { userID, page, size } = req.data;
  console.log(`📥 listChannelsWithFilters called with userID: ${userID}, page: ${page}, size: ${size}`);

  const filters = [{ field: 'status', op: '==', value: 'active' }];
  console.log(`📤 Applying filters: ${JSON.stringify(filters)}`);
  console.log(`📤 page: ${JSON.stringify(page)}`);
  const userDocRef = db.collection('social_feeds').doc(userID);
  try {
    const channels = await getListWithFilters(
      userDocRef,
      'chat_feed',
      page,
      size,
      true,
      filters
    );

    console.log(`✅ Fetched ${channels.length} channels`);
    return { channels, success: true };
  } catch (err) {
    console.error('❌ Error in listChannelsWithFilters:', err);
    return { channels: [], success: false, error: err.message };
  }
});



exports.addMessageReaction = onCall(async (req) => {
  const { authorID, messageID, reaction, channelID } = req.data;
  validateRequiredFields({ authorID, messageID, reaction, channelID });

  const messageDoc = await getDoc(chatChannelsRef.doc(channelID), 'messages', messageID);
  if (messageDoc.exists) {
    const message = messageDoc.data();
    const keys = ['like','love','laugh','angry','surprised','cry','sad'];
    const reactions = message?.reactions ?? keys.reduce((a, v) => ({ ...a, [v]: [] }), {});
    let count = message?.reactionsCount ?? 0;

    const prevKey = keys.find(k => reactions[k]?.includes(authorID));
    if (prevKey) {
      if (prevKey === reaction) {
        reactions[prevKey] = reactions[prevKey].filter(id => id !== authorID);
        count--;
      } else {
        reactions[prevKey] = reactions[prevKey].filter(id => id !== authorID);
        reactions[reaction] = [...reactions[reaction], authorID];
      }
    } else {
      reactions[reaction] = [...reactions[reaction], authorID];
      count++;
    }

    await messageDoc.ref.set({ reactions, reactionsCount: count }, { merge: true });
    return { ...message, reactions, reactionsCount: count };
  }

  return { success: false };
});

exports.updateGroup = onCall(async (req) => {
  const { channelID, userID, channelData } = req.data;
  validateRequiredFields({ channelID, userID, channelData });

  const { content, ...rest } = channelData;
  const user = await fetchUser(userID);

  await chatChannelsRef.doc(channelID).set(rest, { merge: true });
  await hydrateChatFeedsForAllParticipants(channelID, {
    createdAt: Math.floor(Date.now() / 1000),
    senderID: userID,
    content: content,
  }, false);

  return { success: true };
});

exports.deleteGroup = onCall(async (req) => {
  const { channelID } = req.data;
  validateRequiredFields({ channelID });

  const channelDoc = await chatChannelsRef.doc(channelID).get();
  if (channelDoc.exists) {
    const { participants } = channelDoc.data();
    await Promise.all(participants.map(async ({ id }) => {
      await remove(socialFeedsRef.doc(id), 'chat_feed', channelID, true);
    }));
    await chatChannelsRef.doc(channelID).delete();
    await deleteCollection(db, chatChannelsRef.doc(channelID).collection('messages_live'));
    await deleteCollection(db, chatChannelsRef.doc(channelID).collection('messages_historical'));
  }

  return { success: true };
});

exports.leaveGroup = onCall(async (req) => {
  const { channelID, userID, content } = req.data;
  validateRequiredFields({ channelID, userID });

  const channelDocRef = chatChannelsRef.doc(channelID);
  const channelDoc = await channelDocRef.get();

  if (channelDoc.exists) {
    const { participants, admins } = channelDoc.data();
    const newParticipants = participants.filter(p => p?.id !== userID);
    const newAdmins = admins.filter(p => p !== userID);
    await chatChannelsRef.doc(channelID).set({ participants: newParticipants, admins: newAdmins }, { merge: true });
  }

  await hydrateChatFeedsForAllParticipants(channelID, {
    createdAt: Math.floor(Date.now() / 1000),
    senderID: userID,
    content: content,
  }, false);

  await remove(socialFeedsRef.doc(userID), 'chat_feed', channelID, true);
  return { success: true };
});


exports.syncChatFeedStatusOnChannelCreate = onDocumentCreated('channels/{channelID}', async (event) => {
  const channelData = event.data.data();
  const channelID = event.params.channelID;

  if (!channelData) {
    console.log('❌ No data on created channel.');
    return;
  }

  const status = channelData.status || 'active'; // Si no trae status, asumimos 'active'
  console.log(`🚀 New channel created: ${channelID} with status: ${status}`);

  const participants = channelData.participants || [];

  const updates = participants.map(async participant => {
    const userID = participant.id;
  
    if (!userID) {
      console.warn(`⚠️ Invalid participant with missing userID: ${JSON.stringify(participant)}`);
      return;
    }
  
    const feedDocRef = db
      .collection('social_feeds')
      .doc(userID)
      .collection('chat_feed_live')
      .doc(channelID);
  
    const feedSnap = await feedDocRef.get();
    if (!feedSnap.exists) {
      console.log(`⚠️ chat_feed doc missing for user ${userID}`);
      return;
    }
  
    await feedDocRef.set({ status }, { merge: true });
    console.log(`✅ Set initial status in chat_feed for user ${userID}`);
  });

  await Promise.all(updates);
});

exports.syncChatFeedStatusOnChannelUpdate = onDocumentUpdated('channels/{channelID}', async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const channelID = event.params.channelID;

  if (!beforeData || !afterData) {
    console.log('❌ Missing before/after data.');
    return;
  }

  // Solo hacemos algo si el 'status' cambia
  if (beforeData.status === afterData.status) {
    console.log(`ℹ️ No status change for channel ${channelID}, skipping.`);
    return;
  }

  const newStatus = afterData.status;
  console.log(`🔄 Status changed for channel ${channelID}: ${beforeData.status} -> ${newStatus}`);

  const participants = afterData.participants || [];

  const updates = participants.map(async participant => {
    const userID = participant.id;
    const feedDocRef = db
      .collection('social_feeds')
      .doc(userID)
      .collection('chat_feed_live')
      .doc(channelID);

    const feedSnap = await feedDocRef.get();
    if (!feedSnap.exists) {
      console.log(`⚠️ chat_feed doc missing for user ${userID}`);
      return;
    }

    await feedDocRef.set({ status: newStatus }, { merge: true });
    console.log(`✅ Updated chat_feed status for user ${userID}`);
  });

  await Promise.all(updates);
});
