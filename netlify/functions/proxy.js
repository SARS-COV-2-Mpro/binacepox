exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  const path = event.path || "/";

  if (path === "/" || path === "/health") {
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ status: "ok", proxy: "binance-netlify-v1" })
    };
  }

  let base;
  if (path.includes("/fapi/") || path.includes("/futures/")) {
    base = "https://fapi.binance.com";
  } else if (path.includes("/api/")) {
    base = "https://api.binance.com";
  } else {
    return {
      statusCode: 404,
      headers: cors,
      body: JSON.stringify({ error: "Unknown route" })
    };
  }

  const qs = event.rawQuery ? `?${event.rawQuery}` : "";
  const target = `${base}${path}${qs}`;

  try {
    const resp = await fetch(target, {
      headers: { "Accept": "application/json" }
    });
    const body = await resp.text();
    return {
      statusCode: resp.status,
      headers: { ...cors, "X-Proxy": "binance-netlify-v1" },
      body
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: "Upstream failed", message: e?.message })
    };
  }
};
