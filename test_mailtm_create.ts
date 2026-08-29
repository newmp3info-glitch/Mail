import fetch from 'node-fetch';

async function test() {
  try {
    const address = `test_${Math.random().toString(36).substring(2, 10)}@deltajohnsons.com`;
    const password = 'password123';
    
    console.log('Creating account:', address);
    const accountRes = await fetch('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    console.log('Account status:', accountRes.status);
    if (!accountRes.ok) {
      console.log('Account error:', await accountRes.text());
      return;
    }
    console.log('Success!');
  } catch (e) { console.log('error', e); }
}
test();
