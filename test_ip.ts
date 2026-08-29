import dns from 'dns';

dns.resolve4('mail.udo8.com', (err, addresses) => {
  console.log('mail.udo8.com IP:', addresses);
});
dns.resolve4('udo8.com', (err, addresses) => {
  console.log('udo8.com IP:', addresses);
});
