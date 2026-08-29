import dns from 'dns';

dns.resolve4('api.mail.tm', (err, addresses) => {
  console.log('api.mail.tm IP:', addresses);
});
