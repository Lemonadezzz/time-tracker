const { MongoClient } = require('mongodb');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key] = valueParts.join('=');
  }
});

console.log('Testing MongoDB connection...');
console.log('URI:', envVars.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

const client = new MongoClient(envVars.MONGODB_URI);

client.connect()
  .then(() => {
    console.log('✅ MongoDB connection successful');
    return client.db('timetracker').collection('users').findOne({});
  })
  .then((user) => {
    console.log('✅ Database query successful');
    console.log('Found user:', user ? user.username : 'No users found');
    client.close();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    client.close();
  });