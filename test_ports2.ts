import net from 'net';

const ports = [22, 25, 80, 110, 143, 443, 465, 587, 993, 995, 3000, 3306, 5432, 8080, 8443];

async function checkPort(port: number) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(5000);
    client.connect(port, '157.230.203.88', () => {
      console.log(`Port ${port} is open`);
      client.destroy();
      resolve(true);
    });
    client.on('error', () => resolve(false));
    client.on('timeout', () => {
      client.destroy();
      resolve(false);
    });
  });
}

async function run() {
  console.log('Starting port scan...');
  for (const port of ports) {
    const isOpen = await checkPort(port);
    if (isOpen) console.log(`=> Port ${port} is OPEN`);
  }
  console.log('Finished port scan.');
}
run();
