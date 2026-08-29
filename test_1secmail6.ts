import https from 'https';

https.get('https://api.1secmail.com/api/v1/?action=getDomainList', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
}).on('error', (err) => console.log(err));
