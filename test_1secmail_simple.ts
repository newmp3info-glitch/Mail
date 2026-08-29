import http from 'http';
import https from 'https';

https.get('https://www.1secmail.com/api/v1/?action=getDomainList', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('1secmail:', data));
}).on('error', (err) => console.log(err));
