import fetch from 'node-fetch';

async function test() {
  let response = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address');
  let data = await response.json();
  const token = data.sid_token;
  
  response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=testuser2024&sid_token=${token}&domain=guerrillamail.com`);
  data = await response.json();
  console.log("Response guerrillamail.com:", data);
  
  response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=testuser2024&sid_token=${token}&domain=guerrillamail.com`);
  data = await response.json();
  
}
test();
