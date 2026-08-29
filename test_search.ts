async function run() {
  const res = await fetch('https://html.duckduckgo.com/html/?q="udo8.com"');
  const text = await res.text();
  console.log(text.substring(0, 1000));
  const matches = text.match(/<a class="result__url" href="([^"]+)">/g);
  console.log(matches);
}
run();
