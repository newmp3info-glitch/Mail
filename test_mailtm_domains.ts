import fetch from 'node-fetch';

async function test() {
  const domainRes = await fetch('https://api.mail.tm/domains?page=1');
  const domainData = await domainRes.json();
  console.log(domainData['hydra:member'].map((d: any) => d.domain));
}

test();
