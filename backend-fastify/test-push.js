const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://dhanushchakravarthy18_db_user:Dhanush123@pmt.kiqc6ip.mongodb.net/nexus-zoom?retryWrites=true&w=majority&appName=PMT";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Define User schema inline
    const UserSchema = new mongoose.Schema({
      email: String,
      expoPushToken: String
    }, { collection: 'users' });

    const User = mongoose.model('User', UserSchema);

    const user = await User.findOne({ email: 'dhanush@fic.com' });
    if (!user || !user.expoPushToken) {
      console.error('No user or token found for dhanush@fic.com!');
      await mongoose.disconnect();
      return;
    }

    const token = user.expoPushToken;
    console.log(`Found token: ${token} for dhanush@fic.com`);
    console.log('Sending test push notification via Expo Push API...');

    const messages = [{
      to: token,
      sound: 'default',
      title: 'Test Push Notification',
      body: 'If you see this, push notifications are working on your mobile!',
      data: { type: 'chat', test: true }
    }];

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    const status = response.status;
    const text = await response.text();
    console.log(`Expo Push API response status: ${status}`);
    console.log(`Response body: ${text}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error running test:', err);
  }
}

run();
