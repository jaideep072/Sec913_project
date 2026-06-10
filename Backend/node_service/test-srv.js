import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = 'mongodb+srv://admin:admin@cluster0.bvi1e5p.mongodb.net/STEM?retryWrites=true&w=majority&appName=Cluster0';

console.log('Testing SRV with family: 6...');
mongoose.connect(uri, { family: 6, serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Connected successfully to', uri);
    process.exit(0);
  })
  .catch(err => {
    console.log('Failed:', err.message);
    process.exit(1);
  });
