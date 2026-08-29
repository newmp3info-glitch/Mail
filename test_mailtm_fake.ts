import fetch from 'node-fetch';

async function test() {
  try {
    const address = `test_${Math.random().toString(36).substring(2, 10)}@completelyfakedomain12345.com`;
    const password = 'password123';
    
    const accountRes = await fetch('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    console.log(accountRes.status);
    console.log(await accountRes.text());
  } catch (e) { console.log('error', e); }
}
test();
