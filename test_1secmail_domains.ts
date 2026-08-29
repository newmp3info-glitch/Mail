import fetch from 'node-fetch';

async function test() {
  const domainRes = await fetch('https://www.1secmail.com/api/v1/?action=getDomainList');
  const domainData = await domainRes.json();
  console.log(domainData);
}

test();
