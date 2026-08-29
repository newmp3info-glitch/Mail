import fetch from 'node-fetch';

async function test() {
  let response = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  let data = await response.json();
  const token = data.sid_token;
  
  response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=testuser&sid_token=${token}&domain=sharebot.net`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  console.log('Set user status:', response.status);
  console.log('Set user response:', await response.text());
  
  // Now try to check emails
  response = await fetch(`https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=${token}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  console.log('Get emails status:', response.status);
  const emails = await response.json();
  console.log('Emails:', emails.list.length);
}
test();
