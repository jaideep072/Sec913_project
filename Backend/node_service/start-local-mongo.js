import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

// Create a persistent local directory for the database
const dbPath = path.join(process.cwd(), 'local-mongodb-data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

console.log('Starting Local MongoDB Server...');

MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbPath: dbPath,
    // Enable storage engine that supports persistence
    storageEngine: 'wiredTiger'
  }
}).then((mongod) => {
  const uri = mongod.getUri();
  console.log('====================================================');
  console.log('✅ LOCAL MONGODB SERVER IS RUNNING SUCCESSFULLY!');
  console.log(`✅ Connection String: ${uri}`);
  console.log('====================================================');
  console.log('Leave this window open to keep the database running.');
  console.log('You can now connect to this URI using MongoDB Compass!');
}).catch(err => {
  console.error('Failed to start local MongoDB:', err);
});
