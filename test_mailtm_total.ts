import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://api.mail.tm/domains');
  const data = await res.json();
  console.log('Total items:', data['hydra:totalItems']);
}
test();
