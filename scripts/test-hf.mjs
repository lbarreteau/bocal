const t0 = Date.now();
const log = (m) => console.log(`${Date.now() - t0}ms ${m}`);

async function main() {
  try {
    log("fetching HF recipes page...");
    const res = await fetch("https://www.hellofresh.fr/recipes", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20000),
    });
    log(`HF page status ${res.status}`);
    const html = await res.text();
    log(`HF page bytes ${html.length}`);
    const match = html.match(
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
    );
    log(`NEXT_DATA ${Boolean(match)}`);
    if (!match) {
      console.log(html.slice(0, 500));
      return;
    }
    const data = JSON.parse(match[1]);
    const pp = data?.props?.pageProps || {};
    log(`pageProps keys ${Object.keys(pp).join(",")}`);
    const auth = pp?.ssrPayload?.serverAuth;
    log(`token ${auth?.access_token ? "yes" : "no"}`);
    if (!auth?.access_token) {
      const s = JSON.stringify(pp);
      const i = s.indexOf("access_token");
      log(`access_token index ${i}`);
      if (i >= 0) log(s.slice(Math.max(0, i - 80), i + 40));
      return;
    }

    const api = await fetch(
      "https://gw.hellofresh.com/api/recipes/search?country=fr&locale=fr-FR&limit=2&products=classic-box%7Cveggie-box%7Cmeal-plan",
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(20000),
      },
    );
    log(`API ${api.status}`);
    const json = await api.json();
    log(`items ${json.items?.length} total ${json.total}`);
  } catch (e) {
    log(`ERROR ${e.name}: ${e.message}`);
  }
}

main();
