import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://api.mail.gw/domains?domain=sharebot.net');
  console.log(res.status);
  console.log(await res.text());
}
test();
