import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI!

// Global connection with pooling
let client: MongoClient | null = null
let cachedDb: Db | null = null

export async function getDatabase(): Promise<Db> {
  if (cachedDb && client) {
    return cachedDb
  }

  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
  }

  if (!client.topology || !client.topology.isConnected()) {
    await client.connect()
  }

  const db = client.db('timetracker')
  cachedDb = db
  return db
}

export async function getClient() {
  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    await client.connect()
  }
  return client
}