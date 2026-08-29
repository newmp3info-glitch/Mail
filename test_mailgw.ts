async function run() {
  try {
    const domainRes = await fetch('https://api.mail.gw/domains?page=1');
    const domainData = await domainRes.json();
    const domains = domainData['hydra:member'].map((d: any) => d.domain);
    const domain = domains[0];
    const address = `test_${Math.random().toString(36).substring(2, 10)}@${domain}`;
    const password = 'password123';
    
    console.log('Creating account:', address);
    const accountRes = await fetch('https://api.mail.gw/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    console.log('Account status:', accountRes.status);
    if (!accountRes.ok) {
      console.log('Account error:', await accountRes.text());
      return;
    }
    
    console.log('Getting token...');
    const tokenRes = await fetch('https://api.mail.gw/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    console.log('Token status:', tokenRes.status);
    if (!tokenRes.ok) {
      console.log('Token error:', await tokenRes.text());
    } else {
      console.log('Token:', await tokenRes.json());
    }
  } catch (e) { console.log('error', e); }
}
run();
