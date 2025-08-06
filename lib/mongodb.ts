import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!

export async function getDatabase() {
  const client = new MongoClient(uri)
  await client.connect()
  return client.db('timetracker')
}

export async function getClient() {
  const client = new MongoClient(uri)
  await client.connect()
  return client
}