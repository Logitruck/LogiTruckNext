const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const db = admin.firestore();
const socialFeedsRef = db.collection("social_feeds");
const chatChannelsAIRef = db.collection("channels");

const userClient = require("../../core/user");
const { fetchUser } = userClient;

const collectionsUtils = require("../../core/collections");

const { add } = collectionsUtils;
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-c0TX2yDw8Tyd2KDLqepFrJPG",
  project: "proj_7WFAHoemNDjGhLCvoYf8Nvdm",
});

exports.createChannelAI = async (data) => {
  console.log("Creating channel AI:");
  const { id, creatorID, isChatBot, threadID } = data;

  // Verificar si ya existe un canal en Firestore con el mismo ID
  const channelAI = await chatChannelsAIRef.doc(id).get();
  if (channelAI.exists) {
    console.log(`Invalid operation, channel already exists with id: ${id}`);
    return channelAI.data();
  }

  try {
    // Intentar recuperar un thread existente en OpenAI con el mismo ID
    const existingThread = await openai.beta.threads.retrieve(threadID);

    if (existingThread?.id) {
      console.log(
        `Invalid operation, channel thread already exists with id: ${existingThread.id}`
      );
      return {
        status: "error",
        message: "Channel thread already exists in OpenAI.",
      };
    }
  } catch (error) {
    console.log("No existing thread found in OpenAI, creating a new one.");
  }

  // Crear un nuevo thread en OpenAI
  const newThread = await openai.beta.threads.create();

  // Asegurarse de que el nuevo thread fue creado correctamente
  if (!newThread?.id) {
    console.log("Failed to create a new thread in OpenAI.");
    return { status: "error", message: "Failed to create a new thread." };
  }

  // Guardar el nuevo thread en Firestore
  const threadData = {
    ...data,
    threadID: newThread.id, // Almacenar el ID del thread en la base de datos
    // createdThreadAt: Math.floor(new Date().getTime() / 1000),  // Tiempo de creación
  };
  await chatChannelsAIRef.doc(id).set(threadData);

  // Ejemplo de una función para actualizar o "hidratar" los feeds de chat para la IA
  await hydrateChatFeedsForAllParticipants(
    id,
    {
      createdAt: Math.floor(new Date().getTime() / 1000),
      senderID: creatorID,
      content: "New channel AI created.",
    },
    true
  );

  return {
    status: "success",
    message: "Channel AI created successfully.",
    data: threadData,
  };
};

exports.insertMessageAI = async (data) => {
  const { message, channelID, assistantID } = data;

  console.log("assistantID", assistantID, message.id);

  const channelAISnapshot = await chatChannelsAIRef.doc(channelID).get();
  if (!channelAISnapshot.exists) {
    console.error("No document found for channelID:", channelID);
    return; // Handle the case where the document does not exist
  }

  const channelAI = channelAISnapshot.data();

  const threadID = channelAI.threadID;



  const messageData = {
    ...message,
    createdAt: Math.floor(new Date().getTime() / 1000),
  };

  // We first add the message to the channel
  await add(chatChannelsAIRef.doc(channelID), "messages", messageData, true);

   // SEND to OpenAI
  // console.log ('channelAI.......',channelAI)
  const participants = channelAI?.participants;
  if (!Array.isArray(participants)) {
    console.error(
      "participants is not an array or is undefined:",
      participants
    );
    return; // Handle the case where participants is not an array or undefined
  }

  // const participants = channelAI?.participants;
  // const sender = await fetchUser(message.senderID)
  // Encuentra el senderAI directamente desde el arreglo participants
  const senderAI = participants.find(
    (part) => part.appIdentifier === "rn-system"
  );
  if (!senderAI) {
    console.error("No participant found with the appIdentifier 'rn-system'.");
    return; // Handle case appropriately
  }
  // We've inserted a new messsage
  // We need to update channel's metadata afected by the new message (e.g. lastMessage timestamp for the current channel)
  
  const updatedMetadata = {
    lastMessage:
      message?.content?.length > 0 ? message?.content : message?.media,
    lastMessageDate: message?.createdAt,
    lastMessageSenderId: message?.senderID,
    lastThreadMessageId: message.id,
    readUserIDs: [message?.senderID,senderAI.id],
    typingUsers: {},
  };


  console.log('firts updatedMetadata', updatedMetadata)

  await chatChannelsAIRef.doc(channelID).set(updatedMetadata, { merge: true });

  // We now need to update all the denormalized chat feeds for all the participants in the channel
  await hydrateChatFeedsForAllParticipants(channelID, messageData);

 

  const newMessage = await openai.beta.threads.messages.create(threadID, {
    role: "user",
    content: message?.content,
  });
// Set the assistant as typing
await setAssistantTyping(channelID, senderAI.id);

  let run = await openai.beta.threads.runs.createAndPoll(threadID, {
    assistant_id: assistantID,
    instructions:
      "Please address the user as MAX IA an expert support advisor. answer in the language of the question. only whith information of logitruck",
  });

  if (run.status === "completed") {
    const messagesAnswer = await openai.beta.threads.messages.list(
      run.thread_id
    );
    // Insert assistant's responses into Firestore and send them to participants

    let lastAssistantMessage = null;

    // Loop through each message to find the last assistant message
    for (const messageAI of messagesAnswer.data.reverse()) {
      if (messageAI.role === "assistant") {
        lastAssistantMessage = messageAI; // Update lastAssistantMessage to the current message
      }
    }

    // Check if there is an assistant message to process
    if (lastAssistantMessage) {
      const messageID = uuidv4();
      const message = {}; // Initialize the message object
      const createAt = Math.floor(new Date().getTime() / 1000)
      // Populate the message object with the necessary properties
      message.id = messageID;
      message.createdAt = createAt
      message.content = lastAssistantMessage.content[0].text.value;
      message.senderID = senderAI.id;
      message.lastMessage = lastAssistantMessage.content[0].text.value;
      message.lastMessageDate = createAt
      message.lastMessageSenderId = senderAI.id;
      message.senderLastName = "AI";
      message.senderFirstName = "MAX";
      message.senderUserName = "MAX";

      // Update the channel's messages collection
      await add(chatChannelsAIRef.doc(channelID), "messages", message, true);

      // Prepare metadata for updating the channel
      const updatedAIMetadata = {
        lastMessage: message.content,
        lastMessageDate: message.createdAt,
        lastMessageSenderId: message.senderID,
        readUserIDs: [message.senderID],
        typingUsers: {},
      };
      console.log('second  updatedAIMetadata', updatedAIMetadata)
      // Update the channel's metadata
      await chatChannelsAIRef
        .doc(channelID)
        .set(updatedAIMetadata, { merge: true });

      // Update chat feeds for all participants
      console.log('message intro  hydratechat', message)
      await hydrateChatFeedsForAllParticipants(channelID, message);
      // Clear the assistant typing status
      await clearAssistantTyping(channelID, senderAI.id);

    }
  } else {
    console.log(run.status);
  }
  return { success: true };
};

// Assuming 'assistantID' is a known identifier for your AI assistant
const setAssistantTyping = async (channelID, assistantID) => {
  const channelSnapshot = await chatChannelsAIRef.doc(channelID).get();
  if (channelSnapshot.exists) {
    const channelData = channelSnapshot.data();
    const typingUsers = channelData.typingUsers || {};
    typingUsers[assistantID] = { lastTypingDate: Math.floor(new Date().getTime() / 1000) };

    await chatChannelsAIRef.doc(channelID).set({
      typingUsers: typingUsers,
    }, { merge: true });
  }
};

const clearAssistantTyping = async (channelID, assistantID) => {
  const channelSnapshot = await chatChannelsAIRef.doc(channelID).get();
  if (channelSnapshot.exists) {
    const channelData = channelSnapshot.data();
    const typingUsers = channelData.typingUsers || {};
    delete typingUsers[assistantID];  // Remove the assistant from typingUsers

    await chatChannelsAIRef.doc(channelID).set({
      typingUsers: typingUsers,
    }, { merge: true });
  }
};


const hydrateChatFeedsForAllParticipants = async (
  channelID,
  message,
  isNewChannel = false,
  isLeaveGroup = false
) => {
  const channelSnap = await chatChannelsAIRef.doc(channelID).get();
  const channel = channelSnap?.data();
  const participants = channel?.participants;

  // Encuentra el sender directamente desde el arreglo participants
  const sender = participants.find((part) => part.id === message.senderID);
  if (!sender) {
    console.error("Sender not found in participants");
    return; // O maneja esta situación según necesites
  }

  // const sender = await fetchUser(message.senderID)

  console.log("channel:");
  // console.log(JSON.stringify(channel))
  console.log("sender:");
  // console.log(JSON.stringify(sender))

  var feedItemTitleForSender = channel?.name;

  const otherParticipants = participants?.filter(
    (participant) => participant && participant.id !== sender.id
  );

  // if one2one chat then channel name will be other participant name
  if (!channel?.admins) {
    feedItemTitleForSender = `${otherParticipants[0].firstName} ${otherParticipants[0].lastName}`;
  }

  const data = {
    id: channelID,
    title: feedItemTitleForSender ?? "",
    content: message?.content ?? "",
    media: message?.media ?? {},
    markedAsRead: true,
    createdAt: message?.createdAt,
    participants: participants,
    creatorID: channel.creatorID,
    admins: channel?.admins ?? [],
  };

  console.log("hydrateChatFeedsForAllParticipants");

  // We update the chat feed for the sender
  await add(socialFeedsRef.doc(sender.id), "chat_feed", data, true);

  var feedItemTitleForRecipients = channel?.name;

  // if one2one chat then channel name will be other participant name
  if (!channel?.admins) {
    feedItemTitleForRecipients = `${sender?.firstName} ${sender.lastName}`;
  }

  const promises = otherParticipants?.map(async (participant) => {
    // we update the chat feed for all the other participants
    const participantID = participant?.id;
    const data2 = {
      id: channelID,
      title: feedItemTitleForRecipients,
      content: message?.content ?? "",
      media: message?.media ?? {},
      markedAsRead: false,
      createdAt: message?.createdAt,
      participants: participants,
      creatorID: channel.creatorID,
      admins: channel?.admins ?? [],
    };
    // console.log(JSON.stringify(data2))
    await add(socialFeedsRef.doc(participantID), "chat_feed", data2, true);

    return true;
  });
  await Promise.all(promises);
};
exports.hydrateChatFeedsForAllParticipants = hydrateChatFeedsForAllParticipants;
