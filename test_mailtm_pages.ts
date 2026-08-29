import fetch from 'node-fetch';

async function test() {
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(`https://api.mail.tm/domains?page=${i}`);
    const data = await res.json();
    const domains = data['hydra:member']?.map((d: any) => d.domain) || [];
    console.log(`Page ${i}:`, domains);
    if (domains.includes('sharebot.net')) {
      console.log('FOUND sharebot.net on page', i);
    }
  }
}
test();
