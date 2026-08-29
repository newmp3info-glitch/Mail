import fetch from 'node-fetch';

async function test() {
  let response = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  let data = await response.json();
  const token = data.sid_token;
  
  const domains = [
    'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 
    'guerrillamail.org', 'guerrillamails.com', 'sharklasers.com', 
    'grr.la', 'spam4.me', 'pokemail.net'
  ];
  
  for (const domain of domains) {
    response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=testuser&sid_token=${token}&domain=${domain}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const resData = await response.json();
    console.log(`${domain}: ${resData.email_addr}`);
  }
}
test();
