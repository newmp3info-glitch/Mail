async function run() {
  try {
    const res = await fetch('https://api.mail.tm/domains?page=1');
    const data = await res.json();
    console.log(data['hydra:member'].map((d: any) => d.domain));
  } catch (e) { console.log('error', e); }
}
run();
