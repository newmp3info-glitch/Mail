import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://www.1secmail.com/api/v1/?action=getDomainList');
  console.log(await res.text());
}
test();
