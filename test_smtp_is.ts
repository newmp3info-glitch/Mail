import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://smtp.is');
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.log('Error:', e);
  }
}
test();
