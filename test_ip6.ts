import dns from 'dns';

dns.resolve4('api.guerrillamail.com', (err, addresses) => {
  console.log('api.guerrillamail.com IP:', addresses);
});
