import dns from 'dns';

dns.resolve4('mail.maylx.com', (err, addresses) => {
  console.log('mail.maylx.com IP:', addresses);
});
