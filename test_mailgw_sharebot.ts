import fetch from 'node-fetch';

async function test() {
  try {
    const address = `test_${Math.random().toString(36).substring(2, 10)}@sharebot.net`;
    const password = 'password123';
    
    console.log('Creating account on mail.gw:', address);
    const accountRes = await fetch('https://api.mail.gw/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    console.log('Account status:', accountRes.status);
    if (!accountRes.ok) {
      console.log('Account error:', await accountRes.text());
    } else {
      console.log('Success!');
    }
  } catch (e) { console.log('error', e); }
}
test();
