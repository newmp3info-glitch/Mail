import dns from 'dns';

dns.resolveMx('sharebot.net', (err, addresses) => {
  console.log(addresses);
});
