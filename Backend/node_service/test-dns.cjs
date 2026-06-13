const dns = require('dns');
console.log('Testing Node DNS resolution...');
dns.resolveSrv('_mongodb._tcp.cluster0.q9ybvvg.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV Error:', err.message);
  } else {
    console.log('SRV Addresses:', addresses);
  }
});
