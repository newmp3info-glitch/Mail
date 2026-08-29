import dns from 'dns';

dns.resolveMx('sharebot.net', (err, addresses) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('MX Records for sharebot.net:', addresses);
});

dns.resolveMx('guerrillamail.com', (err, addresses) => {
  console.log('MX Records for guerrillamail.com:', addresses);
});
