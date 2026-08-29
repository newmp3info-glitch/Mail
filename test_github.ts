async function run() {
  const res = await fetch('https://api.github.com/search/code?q="udo8.com"', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await res.json();
  console.log(data);
}
run();
