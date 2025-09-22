const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Download from Firebase console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function notifyNewEvent(event) {
  const notificationData = {
    notification: {
      title: "New Event 🎉" + event.title, // Use event title as notification title
      body: `${event.location} • ${event.date} • ${event.time}`,
    },
    topic: "allUsers",
  };
async function notifyUserHasTicket(userFcmToken, event) {
  const message = {
    notification: {
      title: "Your Ticket is Ready 🎫",
      body: `Event: ${event.title}\nLocation: ${event.location}\nDate: ${event.date} ${event.time}`,
    },
    token: userFcmToken, // Send to specific user
    data: {
      eventId: event.id,
      title: event.title,
      location: event.location,
      date: event.date,
      time: event.time,
      image: event.image || "",
      registrationsId: event.registrationsId || "",
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent notification:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
}
