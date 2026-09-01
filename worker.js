const IANA_RDAP_BOOTSTRAP = "https://data.iana.org/rdap/dns.json";

const responseHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: responseHeaders });
}

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/\.$/, "");
}

function isValidDomain(domain) {
  if (domain.length < 3 || domain.length > 253 || !domain.includes(".")) return false;
  return domain.split(".").every((label) =>
    label.length > 0 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
  );
}

async function getRdapBase(tld) {
  const response = await fetch(IANA_RDAP_BOOTSTRAP, {
    headers: { accept: "application/json" },
    cf: { cacheEverything: true, cacheTtl: 86400 },
  });
  if (!response.ok) throw new Error("RDAP bootstrap unavailable");
  const bootstrap = await response.json();
  const service = bootstrap.services?.find(([tlds]) =>
    tlds.some((item) => item.toLowerCase() === tld),
  );
  return service?.[1]?.[0] || null;
}

async function checkDomain(domain) {
  const tld = domain.split(".").pop();
  const base = await getRdapBase(tld);
  if (!base) return { status: "unknown", available: null, reason: "This extension has no public RDAP service." };

  const endpoint = new URL(`domain/${encodeURIComponent(domain)}`, base.endsWith("/") ? base : `${base}/`);
  const response = await fetch(endpoint, {
    headers: { accept: "application/rdap+json, application/json" },
    redirect: "follow",
    signal: AbortSignal.timeout(9000),
    cf: { cacheTtlByStatus: { "200-399": 300, 404: 60, "500-599": 0 } },
  });

  if (response.status === 404) return { status: "available", available: true };
  if (response.ok) return { status: "registered", available: false };
  return { status: "unknown", available: null, reason: `Registry returned ${response.status}.` };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/domain-check") {
      return env.ASSETS.fetch(request);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "access-control-allow-methods": "GET, OPTIONS" } });
    }
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const domain = normalizeDomain(url.searchParams.get("domain"));
    if (!isValidDomain(domain)) {
      return json({ error: "Enter a valid domain such as yourbrand.com." }, 400);
    }

    try {
      const result = await checkDomain(domain);
      return json({ domain, ...result, checkedAt: new Date().toISOString(), source: "Registry RDAP" });
    } catch (error) {
      return json({
        domain,
        status: "unknown",
        available: null,
        reason: "Live registry check is temporarily unavailable.",
        checkedAt: new Date().toISOString(),
      }, 503);
    }
  },
};
