import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const MONGO_URI = 'mongodb://127.0.0.1:27017/nexus-zoom';

async function fixUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log('Total users:', users.length);
    for (const user of users) {
      console.log(`User: ${user.name}, Email: ${user.email}, Workspace: ${user.workspaceId}`);
    }
    
    // Update all users to 'forge-india-connect' to ensure they show up in the current workspace
    const result = await db.collection('users').updateMany({}, { $set: { workspaceId: 'forge-india-connect' } });
    console.log(`Updated ${result.modifiedCount} users to workspace 'forge-india-connect'`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fixUsers();
