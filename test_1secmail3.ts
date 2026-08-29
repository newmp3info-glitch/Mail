import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://www.1secmail.com/api/v1/?action=getDomainList', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  console.log(await res.text());
}
test();
