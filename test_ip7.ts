import dns from 'dns';

dns.resolve4('api.udo8.com', (err, addresses) => {
  console.log('api.udo8.com IP:', addresses);
});
