const dns = require('dns');
// Override Node's internal DNS servers
dns.setServers(['8.8.8.8', '1.1.1.1']);

console.log('Testing Node DNS resolution with overridden servers...');
dns.resolveSrv('_mongodb._tcp.cluster0.q9ybvvg.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV Error:', err.message);
  } else {
    console.log('SRV Addresses:', addresses);
  }
});
