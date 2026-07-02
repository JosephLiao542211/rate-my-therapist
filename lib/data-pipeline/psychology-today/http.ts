/**
 * Anti-bot HTTP session for Psychology Today scraping.
 *
 * Features:
 *  - Oxylabs residential proxy rotation (sticky per session, rotates between regions / on 403)
 *  - Country-targeted IPs (cc-ca for Canada, cc-us for USA)
 *  - Rotating browser profiles (User-Agent + matching sec-ch-ua headers)
 *  - Full browser header suite with Referer tracking and Sec-Fetch-* headers
 *  - Cookie jar — warm-up visit to homepage establishes a real session
 *  - Randomised jitter delays
 *  - Exponential backoff + new IP + new UA on 403
 *
 * Required env vars (optional — falls back to direct if not set):
 *   OXYLABS_USER   your username WITHOUT the "user-" prefix, e.g. "test_1_QNvZM"
 *   OXYLABS_PASS   your Oxylabs password
 */

import { fetch as baseFetch, ProxyAgent } from "undici";

// ── Browser profiles ──────────────────────────────────────────────────────────

interface BrowserProfile {
  ua: string;
  secCh: string | null;
  platform: string;
}

const PROFILES: BrowserProfile[] = [
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    secCh: '"Google Chrome";v="125", "Chromium";v="125", "Not-A.Brand";v="99"',
    platform: '"macOS"',
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    secCh: '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
    platform: '"macOS"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    secCh: '"Google Chrome";v="125", "Chromium";v="125", "Not-A.Brand";v="99"',
    platform: '"Windows"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    secCh: '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
    platform: '"Windows"',
  },
  {
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    secCh: '"Google Chrome";v="125", "Chromium";v="125", "Not-A.Brand";v="99"',
    platform: '"Linux"',
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    secCh: null,
    platform: '"macOS"',
  },
];

// ── Cookie jar ────────────────────────────────────────────────────────────────

class CookieJar {
  private store = new Map<string, string>();

  update(setCookieHeaders: string[]) {
    for (const header of setCookieHeaders) {
      const [pair] = header.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name) this.store.set(name, value);
    }
  }

  serialize(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  get size() {
    return this.store.size;
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function jitter(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickProfile(): BrowserProfile {
  return PROFILES[Math.floor(Math.random() * PROFILES.length)];
}

function randomSessionId(): string {
  return (
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 8)
  );
}

// ── Proxy ─────────────────────────────────────────────────────────────────────

/**
 * Builds an Oxylabs residential ProxyAgent.
 *
 * Proxy URL format:
 *   http://customer-USER-cc-COUNTRY-sessid-SESSIONID:PASS@pr.oxylabs.io:7777
 *
 * Datacenter proxy URL format (Oxylabs):
 *   http://user-USERNAME-country-US:PASS@dc.oxylabs.io:8000
 *
 * - user-USERNAME       → your Oxylabs username prefixed with "user-"
 * - -country-US/CA      → target IPs in that country (uppercase)
 * - Each new connection  → Oxylabs auto-assigns a different datacenter IP from the pool
 *
 * Required env vars:
 *   OXYLABS_USER   the username part only, e.g. "test_1_QNvZM"  (no "user-" prefix)
 *   OXYLABS_PASS   your password
 */
function buildProxyAgent(country: string, _sessionId: string): ProxyAgent | null {
  const user = process.env.OXYLABS_USER;
  const pass = process.env.OXYLABS_PASS;
  if (!user || !pass) return null;

  const cc   = country === "ca" ? "CA" : "US";
  const host = process.env.OXYLABS_HOST ?? "dc.oxylabs.io";
  const port = process.env.OXYLABS_PORT ?? "8000";

  // Datacenter format: user-USERNAME-country-COUNTRYCODE
  const proxyUser = `user-${user}-country-${cc}`;
  const proxyUrl  = `http://${proxyUser}:${encodeURIComponent(pass)}@${host}:${port}`;

  return new ProxyAgent(proxyUrl);
}

function getSetCookies(res: { headers: { getSetCookie?: () => string[]; get: (n: string) => string | null } }): string[] {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}

// ── Session ───────────────────────────────────────────────────────────────────

export class HttpSession {
  private jar      = new CookieJar();
  private profile  = pickProfile();
  private lastUrl  = "";
  private sessionId: string;
  private proxy: ProxyAgent | null;

  /**
   * @param baseDelay  Base delay in ms between requests (actual delays are jittered)
   * @param country    "ca" | "us" — used to target residential IPs in that country
   */
  constructor(private baseDelay = 2000, private country = "ca") {
    this.sessionId = randomSessionId();
    this.proxy     = buildProxyAgent(country, this.sessionId);

    const proxyStatus = this.proxy
      ? `proxy=dc.oxylabs.io:8000 (${country.toUpperCase()}, user-${process.env.OXYLABS_USER}-country-${country === "ca" ? "CA" : "US"})`
      : "proxy=NONE (set OXYLABS_USER + OXYLABS_PASS to enable)";
    process.stdout.write(`  [session] new — ${proxyStatus}\n`);
  }

  /** Force a new residential IP by regenerating the session ID and proxy agent. */
  private rotateIp() {
    this.sessionId = randomSessionId();
    this.proxy     = buildProxyAgent(this.country, this.sessionId);
    process.stdout.write(`  [proxy] rotated IP — new sessid=${this.sessionId}\n`);
  }

  private buildHeaders(url: string, firstRequest = false): Record<string, string> {
    const sameOrigin =
      !firstRequest &&
      this.lastUrl.includes("psychologytoday.com") &&
      url.includes("psychologytoday.com");

    const h: Record<string, string> = {
      "User-Agent":              this.profile.ua,
      Accept:                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language":         "en-US,en;q=0.9",
      "Accept-Encoding":         "gzip, deflate, br",
      "Cache-Control":           "max-age=0",
      Connection:                "keep-alive",
      DNT:                       "1",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest":          "document",
      "Sec-Fetch-Mode":          "navigate",
      "Sec-Fetch-Site":          firstRequest ? "none" : sameOrigin ? "same-origin" : "cross-site",
      "Sec-Fetch-User":          "?1",
    };

    if (this.profile.secCh) {
      h["sec-ch-ua"]          = this.profile.secCh;
      h["sec-ch-ua-mobile"]   = "?0";
      h["sec-ch-ua-platform"] = this.profile.platform;
    }

    if (!firstRequest && this.lastUrl) {
      h["Referer"] = this.lastUrl;
    }

    if (this.jar.size > 0) {
      h["Cookie"] = this.jar.serialize();
    }

    return h;
  }

  private async doFetch(url: string, firstRequest = false) {
    const init: Record<string, unknown> = { headers: this.buildHeaders(url, firstRequest) };
    if (this.proxy) init.dispatcher = this.proxy;
    return baseFetch(url, init as Parameters<typeof baseFetch>[1]);
  }

  /**
   * Warm up the session: visit homepage → therapist finder to get real cookies
   * before any listing or profile pages are hit.
   */
  async warmUp(): Promise<void> {
    const home = "https://www.psychologytoday.com/";
    process.stdout.write(`  [session] warming up — visiting homepage...\n`);

    const r1 = await this.doFetch(home, true);
    this.jar.update(getSetCookies(r1));
    this.lastUrl = home;
    await sleep(jitter(this.baseDelay, this.baseDelay * 2));

    const finder = `https://www.psychologytoday.com/${this.country}/therapists`;
    const r2 = await this.doFetch(finder);
    this.jar.update(getSetCookies(r2));
    this.lastUrl = finder;
    process.stdout.write(
      `  [session] ready — ${this.profile.ua.slice(0, 50)}... cookies=${this.jar.size}\n`
    );

    await sleep(jitter(this.baseDelay, this.baseDelay * 1.5));
  }

  /** Fetch a URL with full browser session, proxy, and retry logic. */
  async fetch(url: string, retries = 6): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      let res: Awaited<ReturnType<typeof baseFetch>>;

      try {
        res = await this.doFetch(url);
      } catch (err) {
        if (attempt === retries) throw err;
        await sleep(jitter(this.baseDelay, this.baseDelay * 3));
        continue;
      }

      this.jar.update(getSetCookies(res));

      if (res.ok) {
        this.lastUrl = url;
        return res.text();
      }

      if (res.status === 403) {
        const wait = this.baseDelay * Math.pow(2, attempt) + jitter(10_000, 30_000);
        console.warn(
          `  [403] attempt ${attempt}/${retries} — rotating IP + UA, cooling off ${(wait / 1000).toFixed(0)}s`
        );
        this.rotateIp();
        this.profile = pickProfile();
        this.jar     = new CookieJar(); // clear cookies — new IP = new session
        if (attempt < retries) await sleep(wait);
        continue;
      }

      if (res.status === 429 || res.status === 503) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "0", 10);
        const wait = retryAfter
          ? retryAfter * 1000 + jitter(1000, 3000)
          : this.baseDelay * attempt * 2 + jitter(2000, 8000);
        console.warn(
          `  [${res.status}] attempt ${attempt}/${retries} — waiting ${(wait / 1000).toFixed(0)}s`
        );
        if (attempt < retries) await sleep(wait);
        continue;
      }

      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
  }
}
