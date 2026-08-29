async function run() {
  const res = await fetch('https://html.duckduckgo.com/html/?q="iswire.com" "api"');
  const text = await res.text();
  const matches = text.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g);
  console.log(matches);
}
run();
