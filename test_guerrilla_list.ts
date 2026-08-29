async function run() {
  try {
    const res = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=bj8d8m2brr9i6ammvhb21o5ld9');
    const data = await res.json();
    console.log(data);
  } catch (e) { console.log('error', e); }
}
run();
