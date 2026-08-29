import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://sharebot.net');
  console.log(res.status);
  console.log(await res.text());
}

test();
