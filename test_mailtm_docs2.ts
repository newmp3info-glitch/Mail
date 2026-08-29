import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://api.mail.tm/docs.json');
    console.log(await res.text());
  } catch (e) {
    console.log('Error:', e);
  }
}
test();
