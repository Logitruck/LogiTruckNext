const admin = require('firebase-admin')
const axios = require('axios')
const firestore = admin.firestore()
const notificationsRef = firestore.collection('notifications')
const userClient = require('../core/user')

const { fetchUser, updateUser } = userClient

const sendPushNotification = async (
  toUserID,
  titleStr,
  contentStr,
  type,
  metadata = {},
) => {
  try {
    console.log(`📨 [sendPushNotification] → userID: ${toUserID}`)
    console.log(`📨 Title: ${titleStr}`)
    console.log(`📨 Body: ${contentStr}`)

    const toUser = await fetchUser(toUserID)

    if (!toUser) {
      console.warn(`⚠️ No user found with ID ${toUserID}`)
      return null
    }

    const pushToken = toUser.pushToken
    let fcmToken = toUser.fcmToken

    console.log(`📦 pushToken: ${pushToken || '❌ not set'}`)
    console.log(`📦 fcmToken: ${fcmToken || '❌ not set'}`)

    if (!pushToken && !fcmToken) {
      console.warn(`⚠️ No pushToken or fcmToken for user ${toUserID}`)
      return null
    }

    // Try to recover fcmToken from pushToken if missing
    if (!fcmToken || fcmToken.length === 0) {
      fcmToken = await retrieveFCMTokenForPushToken(pushToken)
      console.log(`🔄 Recovered fcmToken: ${fcmToken}`)
      if (fcmToken?.length > 0) {
        await updateUser(toUserID, { fcmToken })
      } else {
        console.warn(`⚠️ Failed to retrieve valid FCM token from push token`)
        return null
      }
    }

    const userBadgeCount = await handleUserBadgeCount(toUser)
    console.log(`🔢 Badge count: ${userBadgeCount}`)

    const message = {
      token: fcmToken,
      notification: {
        title: titleStr,
        body: contentStr,
      },
      data: {
        deeplink: metadata?.deeplink || '',
        type: type || '',
        ...Object.fromEntries(
          Object.entries(metadata || {}).map(([key, value]) => [key, String(value)])
        ),
      },
      apns: {
        payload: {
          aps: {
            badge: userBadgeCount,
          },
        },
      },
    }

    console.log('🚀 Sending message:', JSON.stringify(message, null, 2))

    const response = await admin.messaging().send(message)
    console.log(`✅ Notification sent successfully: ${response}`)

    await saveNotificationsToDB(toUser, titleStr, contentStr, type, metadata)

    return { success: true }
  } catch (error) {
    console.error('❌ [sendPushNotification] Error:', error)
    return null
  }
}

const handleUserBadgeCount = async user => {
  const newBadgeCount = (user?.badgeCount ?? 0) + 1
  await updateUser(user.id, { badgeCount: newBadgeCount })
  return newBadgeCount
}

const saveNotificationsToDB = async (toUser, title, body, type, metadata) => {
  const notification = {
    toUserID: toUser.id,
    title,
    body,
    metadata,
    toUser,
    type,
    seen: false,
  }

  const ref = await notificationsRef.add({
    ...notification,
    createdAt: Math.floor(new Date().getTime() / 1000),
  })
  notificationsRef.doc(ref.id).update({ id: ref.id })
}

const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}

const retrieveFCMTokenForPushToken = async pushToken => {
  const url = 'https://iid.googleapis.com/iid/v1:batchImport'
  let config = {
    headers: {
      Authorization:
        'key=AAAABVjck0Q:APA91bGWI2gEQ-b6i5dGtIgYPl0da2rM10kkfPn1KBPJns9AS_oIM3iq0p1VmYSNeMaIXvs4kevHiHEzs-EpZ05Hs-6RQif5kK2g9uvtHxd9vwcZFw_9Ny125_n09xm52h73sR1GzwUv',
      'Content-Type': 'application/json',
    },
  }
  try {
    const res = await axios.post(
      url,
      {
        apns_tokens: [pushToken],
        application: 'io.instamobile.rn.ios.demo',
        sandbox: false,
      },
      config,
    )
    // console.log(
    //   `res for FCM exchange:: ${JSON.stringify(res, getCircularReplacer())}`,
    // )
    console.log(res.data.results)
    return res.data.results[0].registration_token
  } catch (e) {
    console.log(`Error in FCM exchange:: ${e}`)
  }
  return null
}

exports.sendPushNotification = sendPushNotification
