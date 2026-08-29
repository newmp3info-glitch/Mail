async function run() {
  try {
    const randomStr = Math.random().toString(36).substring(2, 10);
    const address = `testuser_${randomStr}@oakon.com`;
    const password = 'password123';
    
    const res = await fetch('https://api.mail.gw/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    const data = await res.json();
    console.log('Account:', data);
    
    const tokenRes = await fetch('https://api.mail.gw/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    const tokenData = await tokenRes.json();
    console.log('Token:', tokenData);
  } catch (e) { console.log('error', e); }
}
run();
