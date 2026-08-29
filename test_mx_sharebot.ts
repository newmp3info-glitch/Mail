import dns from 'dns';

dns.resolveMx('sharebot.net', (err, addresses) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(addresses);
});
