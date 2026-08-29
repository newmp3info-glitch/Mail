import fetch from 'node-fetch';

async function test() {
  const address = `test_${Math.random().toString(36).substring(2, 10)}`;
  const domain = 'sharebot.net';
  
  console.log('Checking inbox:', address, domain);
  const res = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${address}&domain=${domain}`);
  console.log('Status:', res.status);
  if (!res.ok) {
    console.log('Error:', await res.text());
    return;
  }
  console.log('Success!', await res.json());
}
test();
