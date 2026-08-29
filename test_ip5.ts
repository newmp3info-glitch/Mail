import dns from 'dns';

dns.resolve4('api.mail.gw', (err, addresses) => {
  console.log('api.mail.gw IP:', addresses);
});
