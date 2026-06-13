const mongoose = require('mongoose');
const uri = 'mongodb://admin:admin123@ac-b4w5a3b-shard-00-00.q9ybvvg.mongodb.net:27017,ac-b4w5a3b-shard-00-01.q9ybvvg.mongodb.net:27017,ac-b4w5a3b-shard-00-02.q9ybvvg.mongodb.net:27017/STEM?ssl=true&replicaSet=atlas-b4w5a3b-shard-0&authSource=admin&retryWrites=true&w=majority';
mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 5000 }).then(() => {
  console.log('success');
  process.exit(0);
}).catch(e => {
  console.log('fail:', e.message);
  process.exit(1);
});
