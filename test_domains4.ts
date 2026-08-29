async function run() {
  try {
    const res = await fetch('https://www.1secmail.com/api/v1/?action=getDomainList');
    const data = await res.json();
    console.log('1secmail:', data);
  } catch (e) { console.log('error', e); }
}
run();
