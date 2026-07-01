const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://dhanushchakravarthy18_db_user:Dhanush123@pmt.kiqc6ip.mongodb.net/nexus-zoom?retryWrites=true&w=majority&appName=PMT";

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // Define User schema inline
    const UserSchema = new mongoose.Schema({
      email: String,
      expoPushToken: String,
      webPushSubscriptions: Array
    }, { collection: 'users' });

    const User = mongoose.model('User', UserSchema);

    const users = await User.find({
      email: { $in: ['dhanush@fic.com', 'demo@fic.com'] }
    });

    console.log('Users found:', JSON.stringify(users, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
