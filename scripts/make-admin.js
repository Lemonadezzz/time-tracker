const { MongoClient } = require('mongodb');
const fs = require('fs');

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key] = valueParts.join('=');
  }
});

async function makeAdmin() {
  const uri = envVars.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env.local');
    return;
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('timetracker');
    const users = db.collection('users');
    
    // Get the first user (your account)
    const firstUser = await users.findOne({}, { sort: { createdAt: 1 } });
    
    if (firstUser) {
      await users.updateOne(
        { _id: firstUser._id },
        { $set: { role: 'admin', updatedAt: new Date() } }
      );
      console.log(`Updated user "${firstUser.username}" to admin role`);
    } else {
      console.log('No users found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

makeAdmin();