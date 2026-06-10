import mongoose from 'mongoose';

const uri = "mongodb://admin:admin@ac-ysoxzyn-shard-00-00.bvi1e5p.mongodb.net:27017,ac-ysoxzyn-shard-00-01.bvi1e5p.mongodb.net:27017,ac-ysoxzyn-shard-00-02.bvi1e5p.mongodb.net:27017/STEM?ssl=true&replicaSet=atlas-ysoxzyn-shard-0&authSource=admin&retryWrites=true&w=majority";

console.log("Testing connection with family: 6...");
mongoose.connect(uri, { family: 6 })
  .then(() => {
    console.log("SUCCESS");
    process.exit(0);
  })
  .catch(err => {
    console.error("FAIL", err.message);
    process.exit(1);
  });
