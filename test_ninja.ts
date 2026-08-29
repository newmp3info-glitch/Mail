async function run() {
  try {
    const res = await fetch('https://api.tempmail.ninja/domains');
    const data = await res.json();
    console.log(data);
  } catch (e) { console.log('error', e); }
}
run();
