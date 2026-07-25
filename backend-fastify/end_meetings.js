const mongoose = require('mongoose');

const uri = "mongodb+srv://dhanushchakravarthy18_db_user:Dhanush123@pmt.kiqc6ip.mongodb.net/nexus-zoom?retryWrites=true&w=majority&appName=PMT";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const result = await db.collection('meetings').updateMany(
    { status: 'live' },
    { $set: { status: 'ended' } }
  );
  
  console.log(`Updated ${result.modifiedCount} meetings from live to ended.`);
  
  await mongoose.disconnect();
}

run().catch(console.dir);
