async function run() {
  try {
    const res = await fetch('https://api.mail.gw/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'test@invalid-domain.com', password: 'password123' })
    });
    console.log(res.status);
    console.log(await res.json());
  } catch (e) { console.log('error', e); }
}
run();
