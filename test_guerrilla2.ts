async function run() {
  try {
    const res = await fetch('https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=test&sid_token=102f0knqoi8p545ucm94u8u99l&domain=udo8.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = await res.json();
    console.log(data);
  } catch (e) { console.log('error', e); }
}
run();
