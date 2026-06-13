import mongoose from 'mongoose';
const uri = 'mongodb://admin:admin@ac-ysoxzyn-shard-00-00.bvi1e5p.mongodb.net:27017,ac-ysoxzyn-shard-00-01.bvi1e5p.mongodb.net:27017,ac-ysoxzyn-shard-00-02.bvi1e5p.mongodb.net:27017/STEM?ssl=true&replicaSet=atlas-ysoxzyn-shard-0&authSource=admin&retryWrites=true&w=majority';
mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 5000 })
  .then(() => { console.log('success'); process.exit(0); })
  .catch(e => { console.log('fail:', e.message); process.exit(1); });
