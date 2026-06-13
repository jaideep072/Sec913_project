const { MongoClient } = require('mongodb');
const uri = 'mongodb://admin:admin123@ac-b4w5a3b-shard-00-00.q9ybvvg.mongodb.net:27017,ac-b4w5a3b-shard-00-01.q9ybvvg.mongodb.net:27017,ac-b4w5a3b-shard-00-02.q9ybvvg.mongodb.net:27017/STEM?ssl=true&replicaSet=atlas-b4w5a3b-shard-0&authSource=admin&retryWrites=true&w=majority';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
async function run() {
  try {
    console.log('Connecting with raw driver...');
    await client.connect();
    console.log('Success!');
    process.exit(0);
  } catch (e) {
    console.log('Error name:', e.name);
    console.log('Error message:', e.message);
    process.exit(1);
  }
}
run();
