const { onCall, HttpsError, onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const userClient = require('../../core/user');
const { fetchUser } = userClient;
const collectionsUtils = require('../../core/collections');
const { add, remove, getList, getDoc, deleteCollection } = collectionsUtils;
const { OpenAI } = require('openai');
const db = admin.firestore();

const chatChannelsRef = db.collection('channelsAI');

const { createChannelAI, insertMessageAI } = require('./utils');

const openAIKey = defineSecret('OPENAI_API_KEY');

exports.chatAssistant = onRequest(
  { timeoutSeconds: 120, region: ['us-central1'], secrets: [openAIKey] },
  async (req, res) => {
    const openai = new OpenAI({
      apiKey: openAIKey.value(),
      organization: 'org-c0TX2yDw8Tyd2KDLqepFrJPG',
      project: 'proj_7WFAHoemNDjGhLCvoYf8Nvdm',
    });
    if (req.method !== "GET" || !req.query.question) {
      return res.status(400).send('Bad Request: Missing "question" parameter');
    }

    // Extrae la pregunta del parámetro de la URL
    const userQuestion = req.query.text;

    try {
      const listAssistant = await openai.beta.assistants.list({
        order: 'desc',
        limit: 1,
      });
  
      if (listAssistant.data.length === 0) {
        return res.status(404).send('No assistants found.');
      }
  
      const assistantId = listAssistant.data[0].id;
      const run = await openai.beta.threads.createAndRun({
        assistant_id: assistantId,
        thread: {
          messages: [{ role: "user", content: userQuestion}],
        },
      });
      console.log("Initial run state:", run.status);
      console.log("Initial run data:", run);

      let status = run.status;
      let threadId = run.thread_id;
      let runid = run.id;
  
      while (status !== 'completed' && status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 segundos
        const update = await openai.beta.threads.runs.retrieve(threadId,runid);
        status = update.status;
        console.log("Updated status:", status); // Log para ver cómo cambia el estado
      }

     
      if (status === 'completed') {
        const messages = await openai.beta.threads.messages.list(threadId);
        const assistantResponses = messages.data
          .filter(m => m.role === 'assistant') // Filtrar solo mensajes del asistente
          .map(m => m.content[0].text.value) // Extraer el texto de cada mensaje
          .join('\n'); // Unir todos los mensajes en un solo texto
        
        console.log(assistantResponses);

        const threadMessages = await openai.beta.threads.messages.create(
          threadId,
          { role: "user", content: "tienen algun sistema para el rastreo" }
        );
        
        let updaterun = await openai.beta.threads.runs.createAndPoll(
          threadId,
          { 
            assistant_id: assistantId,
            instructions: "Please address the user as Jane Doe. The user has a premium account."
          }
        );
      
        if (updaterun.status === 'completed') {
          const messagesend = await openai.beta.threads.messages.list(
            updaterun.thread_id
          );
          for (const message of messagesend.data.reverse()) {

            console.log(`${message.role} > ${message.content[0]?.text.value}`);
          }
          res.status(200).send(messagesend);

        } else { 
          console.log(updaterun.status);
        }

        
      } else {
        console.log(`Thread ended with status: ${status}`);
        res.status(500).send(`Thread ended with status: ${status}`);
      }


    } catch (error) {
      console.error("Error communicating with the assistant: ", error);
      res.status(500).send(`Error: ${error.message}`);
    }
  });


exports.createChannelAI = onCall({ secrets: [openAIKey] }, async (req, context) => {
  return await createChannelAI(req.data)
})

exports.markAsRead = onCall(async (req) => {
  console.log('Mark as read: ')
  // console.log(JSON.stringify(data))

  const { channelID, userID, messageID, readUserIDs } = req.data

  const dedupedReadUserIDs = [...new Set(readUserIDs)]

  if (messageID) {
    // update the array of readUserIDs for the last message in the channel (used for seen status facepile in chat room)
    const doc = await getDoc(
      chatChannelsRef.doc(channelID),
      'messages',
      messageID,
    )
    console.log(doc)
    if (doc?.ref) {
      doc.ref.set({ readUserIDs }, { merge: true })
    }
  }

  // mark last message as read in the channel (used for seen status in Home)
  const channel = await chatChannelsRef.doc(channelID).get()
  if (channel.exists) {
    // we only update readUserIDs if the channel exists already
    chatChannelsRef.doc(channelID).set(
      {
        readUserIDs: dedupedReadUserIDs,
      },
      { merge: true },
    )
  }

  // mark last message as read in the user's feed (used for bolding out unread messages on home screen)
  await add(socialFeedsRef.doc(userID), 'chat_feed', {
    id: channelID,
    markedAsRead: true,
  })

  return { success: true }
})

exports.markUserAsTypingInChannel = onCall(
  async (req) => {
    console.log('Update user as typing in channel: ')
    // console.log(JSON.stringify(data))

    const { channelID, userID } = req.data
    const channel = await chatChannelsRef.doc(channelID).get()

    if (channel.exists) {
      // we only update typingUsers if the channel exists already
      const channelData = channel.data()
      var typingUsers = (channelData ? channelData.typingUsers : {}) ?? {}
      typingUsers[userID] = {
        lastTypingDate: Math.floor(new Date().getTime() / 1000),
      }
      chatChannelsRef.doc(channelID).set(
        {
          typingUsers: typingUsers,
        },
        { merge: true },
      )
    }

    return { success: true }
  },
)

exports.listMessages = onCall(async (req) => {
  const { channelID, page, size } = req.data
  console.log(`fetching messages `)
  // console.log(JSON.stringify(data))

  const messages = await getList(
    chatChannelsRef.doc(channelID),
    'messages',
    page,
    size,
    true,
  )
  if (messages?.length > 0) {
    console.log(`fetched messages: `)
    // console.log(messages)
    return { messages, success: true }
  } else {
    return { messages: [], success: true }
  }
})

exports.insertMessageAI = onCall({ secrets: [openAIKey] }, async (req, context) => {
  return await insertMessageAI(req.data)
})


exports.listChannelsAI = onCall(async (req, context) => {
  const { userID, page, size } = req.data
  console.log(`fetching chat AI channels `)
  // console.log(JSON.stringify(data))

  const channelsAI = await getList(
    socialFeedsRef.doc(userID),
    'chat_feed',
    page,
    size,
    true,
  )
  if (channelsAI?.length > 0) {
    console.log(`fetched channels: `)
    // console.log(JSON.stringify(channels))
    return { channelsAI, success: true }
  } else {
    return { channelsAI: [], success: true }
  }
})