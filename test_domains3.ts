import https from 'https';

function fetchDomains(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const res = await fetchDomains('https://api.tempmail.lol/v2/domains');
    console.log('tempmail.lol:', res);
  } catch (e) { console.log('error', e); }
}
run();
