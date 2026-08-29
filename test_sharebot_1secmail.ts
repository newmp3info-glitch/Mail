import fetch from 'node-fetch';

async function run() {
  try {
    const address = `test_${Math.random().toString(36).substring(2, 10)}`;
    const domain = 'sharebot.net';
    
    console.log('Checking inbox:', address, domain);
    const res = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${address}&domain=${domain}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Status:', res.status);
    if (!res.ok) {
      console.log('Error:', await res.text());
      return;
    }
    console.log('Success!', await res.json());
  } catch (e) { console.log('error', e); }
}
run();
