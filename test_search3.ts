async function run() {
  const res = await fetch('https://html.duckduckgo.com/html/?q="udo8.com" "api"');
  const text = await res.text();
  const matches = text.match(/<a class="result__url" href="([^"]+)">/g);
  console.log(matches);
}
run();
