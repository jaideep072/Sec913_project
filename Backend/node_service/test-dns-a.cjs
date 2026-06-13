const dns = require('dns');
console.log('Testing Node DNS A resolution...');
dns.resolve4('ac-b4w5a3b-shard-00-00.q9ybvvg.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('A Error:', err.message);
  } else {
    console.log('A Addresses:', addresses);
  }
});
