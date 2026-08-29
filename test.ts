async function test() {
  try {
    const res = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=1e2turjeqg2vo6u0bgf9r6ultl');
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();
