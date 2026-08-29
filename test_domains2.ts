import https from 'https';

function fetchDomains(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const secmail = await fetchDomains('https://www.1secmail.com/api/v1/?action=getDomainList');
    console.log('1secmail:', secmail);
  } catch (e) { console.log('1secmail error', e); }
}
run();
