async function run() {
  const res = await fetch('https://html.duckduckgo.com/html/?q="udo8.com" temp mail');
  const text = await res.text();
  const matches = text.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g);
  console.log(matches);
}
run();
