const mongoose = require('mongoose');
const uri = 'mongodb://admin:admin123@159.41.227.49:27017,159.41.240.107:27017,159.41.225.248:27017/STEM?ssl=true&replicaSet=atlas-b4w5a3b-shard-0&authSource=admin&retryWrites=true&w=majority&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true';
console.log('Testing direct IP connection to bypass DNS...');
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => { console.log('Successfully connected to new cluster!'); process.exit(0); })
  .catch(e => { console.log('Failed:', e.message); process.exit(1); });
