import net from 'net';

const ports = [80, 443, 25, 110, 143, 587, 993, 995, 3000, 8080, 8000, 5000];

async function checkPort(port: number) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(2000);
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
  for (const port of ports) {
    await checkPort(port);
  }
}
run();
