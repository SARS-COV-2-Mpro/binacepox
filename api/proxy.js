export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const path = req.url || "/";

  if (path === "/" || path === "/health") {
    return res.status(200).json({ status: "ok", proxy: "binance-vercel-v1" });
  }

  let base;
  if (path.startsWith("/fapi/") || path.startsWith("/futures/")) {
    base = "https://fapi.binance.com";
  } else if (path.startsWith("/api/")) {
    base = "https://api.binance.com";
  } else {
    return res.status(404).json({ error: "Unknown route" });
  }

  const targetURL = new URL(path, base);

  const qp = new URL(req.url, "http://localhost").searchParams;
  for (const [k, v] of qp.entries()) {
    targetURL.searchParams.set(k, v);
  }

  try {
    const upstream = await fetch(targetURL.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    const body = await upstream.text();

    return res
      .status(upstream.status)
      .setHeader("Content-Type", "application/json")
      .setHeader("X-Proxy", "binance-vercel-v1")
      .send(body);

  } catch (e) {
    return res.status(502).json({
      error: "Upstream failed",
      message: e?.message || String(e)
    });
  }
}
