const { getDatabase } = require('./lib/mongodb');

async function test() {
  try {
    console.log('Attempting to connect to MongoDB via lib/mongodb.ts...');
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    console.log('Successfully connected!');
    console.log('Collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    process.exit();
  }
}

test();
