async function run() {
  try {
    let response = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address');
    let data = await response.json();
    const token = data.sid_token;
    
    response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=invalid@name&sid_token=${token}&domain=guerrillamail.com`);
    console.log(response.status);
    console.log(await response.text());
  } catch (e) { console.log('error', e); }
}
run();
