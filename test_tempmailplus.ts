import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://tempmail.plus/api/domains');
    console.log(await res.text());
  } catch (e) {
    console.log('Error:', e);
  }
}
test();
