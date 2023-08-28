const webpush = require("web-push");
const express = require("express");
const app = express();
const bodyparser = require("body-parser");
const cors = require("cors");
const port = 3000;
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const vapidKeys = {
  publicKey:
    "BE1DOuy5qzVVanYhcD8cnd7NIMuv5PDinH6YO-rwaEGzTax4WWck_CZ9tFPi_zsBeDs5r6IYAP8K1XZ8x8_KW5o",
  privateKey: "SooeMFMBiJ3NTTWCY0NOzCuvuT6-n-Rs8q3vk1_txX8",
};

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Connect to Database.
mongoose.connect(
  "mongodb+srv://Omama:omama123456@cluster0.ifhalel.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// Mongoose Schema
const subscriptionSchema = new mongoose.Schema({
  endpoint: String,
  expirationTime: String,
  keys: {
    auth: String,
    p256dh: String,
  },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

app.use(express.json());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(cors());

// Create Routes....

app.post('/api/subscribe', async (req, res) => {
  const subscription = req.body;
  try {
    const newSubscription = new Subscription(subscription);
    await newSubscription.save();

    // Send a welcome notification to the newly subscribed client
    const notificationPayload = {
      notification: {
        title: 'Welcome!',
        body: 'Thank you for subscribing to our notifications.',
        icon: 'icons/icon-72x72.png',
      }
    };
    sendNotificationToSubscriber(subscription, notificationPayload);
    res.status(201).json({ message: 'Subscription successful' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.sendStatus(500);
  }
});

app.get('/api/subscriber', async (req, res) => {
  try {
    const subscriber = await Subscription.find();
    res.send(subscriber);
  } catch (error) {
    console.log(error);
  }
});

// Route to send push notifications to subscribed clients
// app.post('/api/sendNotifications', (req, res) => {
//   const notificationPayload = {
//     notification: {
//       title: 'New Notification',
//       body: 'This is the body of the notification',
//       icon: 'icons/icon-72x72.png',
//     }
//   };

//   Subscription.find({}, (err, subscriptions) => {
//     if (err) {
//       console.error('Error fetching subscriptions:', error);
//       res.sendStatus(500);
//     } else {
//       const promises = subscriptions.map((subscription) => {
//         return webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
//           .catch((error) => {
//             console.error('Error sending push notification:', error);
//           });
//       });

//       Promise.all(promises)
//         .then(() => {
//           res.status(200).json({ message: 'Push notifications sent successfully' });
//         })
//         .catch((error) => {
//           console.error('Error sending push notifications:', error);
//           res.sendStatus(500);
//         });
//     }
//   });
// });


function sendNotificationToSubscriber(subscription, notificationPayload) {
  webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
    .then(() => {
      console.log('Push notification sent successfully');
    })
    .catch((error) => {
      console.error('Error sending push notification:', error);
    });
}

app.listen(port, () => console.log("Server Started...."));
