import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://dropmail.me/api/graphql/web-test-20240101', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { domains { id name } }`
      })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.log('Error:', e);
  }
}
test();
