async function run() {
  try {
    const res = await fetch('https://www.1secmail.com/api/v1/?action=getDomainList', {
      headers: {
        'User-Agent': 'curl/7.68.0'
      }
    });
    const text = await res.text();
    console.log(text);
  } catch (e) { console.log('error', e); }
}
run();
