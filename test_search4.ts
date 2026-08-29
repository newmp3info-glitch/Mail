async function run() {
  const res = await fetch('https://html.duckduckgo.com/html/?q="157.230.203.88"');
  const text = await res.text();
  const matches = text.match(/<a class="result__url" href="([^"]+)">/g);
  console.log(matches);
}
run();
