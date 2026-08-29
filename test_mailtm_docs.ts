import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://api.mail.tm/docs.json');
    const data = await res.json();
    console.log(Object.keys(data.paths));
  } catch (e) {
    console.log('Error:', e);
  }
}
test();
