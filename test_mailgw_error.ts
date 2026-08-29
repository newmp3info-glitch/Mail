async function run() {
  try {
    const address = `invalid name@oakon.com`;
    const password = Math.random().toString(36).substring(2, 15);

    console.log('Creating account:', address, password);
    const accountRes = await fetch('https://api.mail.gw/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    
    if (!accountRes.ok) {
      const errData = await accountRes.json();
      console.log('Account creation failed:', errData);
      return;
    }
    console.log('Account created');
  } catch (e) { console.log('error', e); }
}
run();
