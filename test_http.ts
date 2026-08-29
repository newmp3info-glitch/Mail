async function run() {
  try {
    const res = await fetch('https://tempmail.plus/api/domains');
    const data = await res.json();
    console.log(data);
  } catch (e) { console.log('error', e); }
}
run();
