async function run() {
  try {
    const res = await fetch('http://157.230.203.88');
    const text = await res.text();
    console.log(text.substring(0, 500));
  } catch (e) { console.log('error', e); }
}
run();
