import fetch from 'node-fetch';

async function test() {
  const domainRes = await fetch('https://api.tempmail.lol/v2/domains');
  const text = await domainRes.text();
  console.log(text);
}

test();
