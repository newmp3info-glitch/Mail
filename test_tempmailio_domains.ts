import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://api.temp-mail.io/api/v1/domains');
    console.log(await res.json());
  } catch (e) {
    console.log('Error:', e);
  }
}
test();
