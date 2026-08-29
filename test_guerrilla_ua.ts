async function run() {
  try {
    let response = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(response.status);
    console.log(await response.text());
  } catch (e) { console.log('error', e); }
}
run();
