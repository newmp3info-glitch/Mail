import dns from 'dns';

dns.resolveMx('1secmail.com', (err, addresses) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('1secmail.com MX:', addresses);
});
