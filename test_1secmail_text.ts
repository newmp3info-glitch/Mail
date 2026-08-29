import fetch from 'node-fetch';

async function test() {
  const domainRes = await fetch('https://www.1secmail.com/api/v1/?action=getDomainList');
  const text = await domainRes.text();
  console.log(text);
}

test();
