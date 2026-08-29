import net from 'net';

const client = new net.Socket();
client.connect(110, 'mail.udo8.com', () => {
  console.log('Connected to POP3');
  client.on('data', (data) => {
    console.log('Received: ' + data.toString());
    client.destroy();
  });
});
client.on('error', (err) => console.error(err));
