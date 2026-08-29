import dns from 'dns';

dns.resolve4('mail.arktico.com', (err, addresses) => {
  console.log('mail.arktico.com IP:', addresses);
});
