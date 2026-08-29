async function run() {
  try {
    const res = await fetch('https://api.mail.gw/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: 'testuser123456789@oakon.com',
        password: 'password123'
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (e) { console.log('error', e); }
}
run();
