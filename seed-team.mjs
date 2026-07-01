import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/nexus-zoom';

async function seedTeam() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');

    const fakeHash = '$2b$12$KIXeW3Cj1C9M3m.zXj3K/ey9K5Jq4yR1P1J/U8gC9R9w.L4Q7nZ2e';

    const usersToInsert = [
      {
        name: 'Avinash',
        email: 'avinash@fic.com',
        role: 'Manager',
        workspaceId: 'forge-india-connect',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Avinash',
        mfaEnabled: false,
        passwordHash: fakeHash,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Agila',
        email: 'agila@fic.com',
        role: 'Team Leader',
        workspaceId: 'forge-india-connect',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Agila',
        mfaEnabled: false,
        passwordHash: fakeHash,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Developer One',
        email: 'dev1@fic.com',
        role: 'Developer',
        workspaceId: 'forge-india-connect',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Dev1',
        mfaEnabled: false,
        passwordHash: fakeHash,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const u of usersToInsert) {
      await usersCol.updateOne(
        { email: u.email },
        { $set: u },
        { upsert: true }
      );
    }
    
    console.log('Seeded Avinash, Agila, and Developer One to forge-india-connect workspace.');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

seedTeam();
