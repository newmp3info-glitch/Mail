async function run() {
  try {
    const res2 = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=test&domain=guerrillamail.com`);
    console.log(res2.status);
  } catch (e) { console.log('error', e); }
}
run();
