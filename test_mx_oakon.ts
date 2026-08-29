import dns from 'dns';

dns.resolveMx('oakon.com', (err, addresses) => {
  console.log('MX Records for oakon.com:', addresses);
});
