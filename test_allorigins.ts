async function run() {
  try {
    const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.1secmail.com/api/v1/?action=getDomainList'));
    const data = await res.json();
    console.log(JSON.parse(data.contents));
  } catch (e) { console.log('error', e); }
}
run();
