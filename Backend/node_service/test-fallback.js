import mongoose from 'mongoose';

const uri = 'mongodb+srv://test:admin@cluster0.hxyc73f.mongodb.net/Accessible_Knowledge_System?appName=Cluster0';

console.log('Testing fallback URI with family: 6...');
mongoose.connect(uri, { family: 6, serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Fallback Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.log('Fallback Failed:', err.message);
    process.exit(1);
  });
