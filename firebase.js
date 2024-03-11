const { Firestore } = require("@google-cloud/firestore");
var admin = require("firebase-admin");
var serviceAccount = require("./key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const message = {
  data: {
    customKey: "someValue",
    title: "Notification Title",
    body: "Notification Body",
  },
  token:
    "eIA7aGiHz9Am-8Jx1k_76I:APA91bFAPlePSTsvOM24Sh7RK30o617U_lnSesKZO7pZHQuuy19qy7H3Cyy4l2-sY62EdaFpUi8s3mnjTWcTMIfE1ZABVXqIi8oYHfCEpBGDaBFkSWjkzYncS7eudX1HzrIV2GOk8chy",
};

admin
  .messaging()
  .send(message)
  .then((response) => {
    console.log("Successfully sent message:", response);
  })
  .catch((error) => {
    console.log("Error sending message:", error);
  });

// Initialize Firestore
const firestore = new Firestore({ projectId: "capstonenotification-bdce8", keyFilename: "./key.json" });
// Function to save token to Firestore
async function saveTokenToFirestore(userId, token) {
  const docRef = firestore.collection("userToken").doc(userId);
  await docRef.set({ token });
}

// Function to fetch token from Firestore
async function getTokenFromFirestore(userId) {
  const docRef = firestore.collection("userToken").doc(userId);
  const doc = await docRef.get();
  if (doc.exists) {
    return doc.data().token;
  } else {
    return null;
  }
}
// saveTokenToFirestore(
//   "1",
//   "eIA7aGiHz9Am-8Jx1k_76I:APA91bFAPlePSTsvOM24Sh7RK30o617U_lnSesKZO7pZHQuuy19qy7H3Cyy4l2-sY62EdaFpUi8s3mnjTWcTMIfE1ZABVXqIi8oYHfCEpBGDaBFkSWjkzYncS7eudX1HzrIV2GOk8chy"
// );

console.log(getTokenFromFirestore("1"));
