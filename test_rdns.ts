import dns from 'dns';

dns.reverse('157.230.203.88', (err, hostnames) => {
  console.log('Hostnames:', hostnames);
});
