/**
 * HTTP session for Psychology Today scraping.
 *
 * Techniques:
 *  1. HTTP/2 via undici Agent (allowH2: true) — matches browser protocol fingerprint
 *  2. Cookie jar persisted to disk — avoids new-session detection across runs
 *  3. Log-normal delays — matches real human browsing cadence vs uniform random
 *  4. No DNT header — DNT:1 is a known bot signal; real users don't set it
 *  +  IP origin spoofing (X-Forwarded-For / X-Real-IP / X-Originating-IP)
 *  +  Path normalization to bypass literal string filters
 *  +  Rotating browser profiles (User-Agent + sec-ch-ua)
 */

import fs from "fs";
import path from "path";
import { fetch as undiciFetch, Agent } from "undici";

const SESSION_FILE = path.resolve("lib/data-pipeline/psychology-today/.session.json");
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

// ── HTTP/2 agent ──────────────────────────────────────────────────────────────

const h2Agent = new Agent({ allowH2: true, keepAliveTimeout: 30_000 });

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

// ── Spoof IPs ─────────────────────────────────────────────────────────────────

const SPOOF_IPS = ["127.0.0.1", "10.0.0.1", "10.0.1.1", "192.168.1.1", "172.16.0.1"];

function pickSpoofIp(): string {
  return SPOOF_IPS[Math.floor(Math.random() * SPOOF_IPS.length)];
}

// ── Path normalization ────────────────────────────────────────────────────────

const PATH_VARIANTS = [
  (p: string) => p,
  (p: string) => {
    const parts = p.split("/").filter(Boolean);
    if (parts.length < 2) return p;
    parts.splice(1, 0, ".");
    return "/" + parts.join("/");
  },
];

let pathVariantIndex = 0;
const NUMERIC_TAIL = /\/\d+$/;

export function normalizePath(url: string): string {
  const u = new URL(url);
  if (NUMERIC_TAIL.test(u.pathname)) return url;
  const variant = PATH_VARIANTS[pathVariantIndex % PATH_VARIANTS.length];
  pathVariantIndex++;
  u.pathname = variant(u.pathname);
  return u.toString();
}

// ── Cookie jar (with disk persistence) ───────────────────────────────────────

interface PersistedSession {
  savedAt: number;
  profileUa: string;
  cookies: [string, string][];
}

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

  entries(): [string, string][] {
    return [...this.store.entries()];
  }

  load(entries: [string, string][]) {
    for (const [k, v] of entries) this.store.set(k, v);
  }

  get size() {
    return this.store.size;
  }
}

function loadSession(): PersistedSession | null {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8")) as PersistedSession;
    if (Date.now() - raw.savedAt > SESSION_MAX_AGE_MS) {
      fs.unlinkSync(SESSION_FILE);
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

function saveSession(jar: CookieJar, ua: string) {
  const data: PersistedSession = { savedAt: Date.now(), profileUa: ua, cookies: jar.entries() };
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data));
}

// ── Log-normal delay (technique 3) ───────────────────────────────────────────

function boxMullerNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Returns a delay in ms sampled from a log-normal distribution.
 * Most values cluster near `mean`, with a long tail of occasional longer pauses —
 * matching real human click cadence better than uniform jitter.
 */
export function lognormalDelay(mean: number, sigma = 0.6): number {
  const mu = Math.log(mean) - (sigma * sigma) / 2;
  const ms = Math.round(Math.exp(mu + sigma * boxMullerNormal()));
  return Math.max(200, ms);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function jitter(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickProfile(): BrowserProfile {
  return PROFILES[Math.floor(Math.random() * PROFILES.length)];
}

function getSetCookies(res: { headers: { getSetCookie?: () => string[]; get: (n: string) => string | null } }): string[] {
  if (typeof res.headers.getSetCookie === "function") return res.headers.getSetCookie();
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}

// ── Session ───────────────────────────────────────────────────────────────────

export class HttpSession {
  private jar     = new CookieJar();
  private profile = pickProfile();
  private lastUrl = "";

  constructor(private baseDelay = 2000, private country = "ca") {
    const prior = loadSession();
    if (prior) {
      this.jar.load(prior.cookies);
      const match = PROFILES.find((p) => p.ua === prior.profileUa);
      if (match) this.profile = match;
      process.stdout.write(
        `  [session] restored from disk — cookies=${this.jar.size}, ua=${this.profile.ua.slice(0, 40)}...\n`
      );
    } else {
      process.stdout.write(`  [session] new — HTTP/2 enabled\n`);
    }
  }

  private buildHeaders(url: string, firstRequest = false): Record<string, string> {
    const spoofIp = pickSpoofIp();
    const sameOrigin =
      !firstRequest &&
      this.lastUrl.includes("psychologytoday.com") &&
      url.includes("psychologytoday.com");

    const h: Record<string, string> = {
      "User-Agent":                this.profile.ua,
      Accept:                      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language":           "en-US,en;q=0.9",
      "Accept-Encoding":           "gzip, deflate, br",
      "Cache-Control":             "max-age=0",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest":            "document",
      "Sec-Fetch-Mode":            "navigate",
      "Sec-Fetch-Site":            firstRequest ? "none" : sameOrigin ? "same-origin" : "cross-site",
      "Sec-Fetch-User":            "?1",
      "X-Forwarded-For":           spoofIp,
      "X-Real-IP":                 spoofIp,
      "X-Originating-IP":          spoofIp,
    };

    if (this.profile.secCh) {
      h["sec-ch-ua"]          = this.profile.secCh;
      h["sec-ch-ua-mobile"]   = "?0";
      h["sec-ch-ua-platform"] = this.profile.platform;
    }

    if (!firstRequest && this.lastUrl) h["Referer"] = this.lastUrl;
    if (this.jar.size > 0) h["Cookie"] = this.jar.serialize();

    return h;
  }

  private async doFetch(url: string, firstRequest = false) {
    return undiciFetch(url, {
      dispatcher: h2Agent,
      headers: this.buildHeaders(url, firstRequest),
    } as Parameters<typeof undiciFetch>[1]);
  }

  async warmUp(): Promise<void> {
    if (this.jar.size > 0) {
      process.stdout.write(`  [session] skipping warm-up — using restored cookies\n`);
      return;
    }

    const home = "https://www.psychologytoday.com/";
    process.stdout.write(`  [session] warming up — visiting homepage...\n`);

    const r1 = await this.doFetch(home, true);
    this.jar.update(getSetCookies(r1));
    this.lastUrl = r1.url ?? home;
    await sleep(lognormalDelay(this.baseDelay));

    const finder = `https://www.psychologytoday.com/${this.country}/therapists`;
    const r2 = await this.doFetch(finder);
    this.jar.update(getSetCookies(r2));
    this.lastUrl = r2.url ?? finder;

    saveSession(this.jar, this.profile.ua);
    process.stdout.write(
      `  [session] ready — ${this.profile.ua.slice(0, 50)}... cookies=${this.jar.size} (saved to disk)\n`
    );

    await sleep(lognormalDelay(this.baseDelay));
  }

  async fetch(url: string, retries = 6): Promise<{ html: string; finalUrl: string }> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const normalizedUrl = normalizePath(url);
      let res: Awaited<ReturnType<typeof undiciFetch>>;

      try {
        res = await this.doFetch(normalizedUrl);
      } catch (err) {
        if (attempt === retries) throw err;
        await sleep(lognormalDelay(this.baseDelay * 2));
        continue;
      }

      this.jar.update(getSetCookies(res));

      if (res.ok) {
        this.lastUrl = normalizedUrl;
        saveSession(this.jar, this.profile.ua);
        return { html: await res.text(), finalUrl: res.url ?? normalizedUrl };
      }

      if (res.status === 403) {
        const wait = this.baseDelay * Math.pow(2, attempt) + lognormalDelay(10_000);
        console.warn(
          `  [403] attempt ${attempt}/${retries} — rotating UA + clearing session, cooling off ${(wait / 1000).toFixed(0)}s`
        );
        this.profile = pickProfile();
        this.jar     = new CookieJar();
        try { fs.unlinkSync(SESSION_FILE); } catch {}
        if (attempt < retries) await sleep(wait);
        continue;
      }

      if (res.status === 429 || res.status === 503) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "0", 10);
        const wait = retryAfter
          ? retryAfter * 1000 + lognormalDelay(2000)
          : lognormalDelay(this.baseDelay * attempt * 2);
        console.warn(
          `  [${res.status}] attempt ${attempt}/${retries} — waiting ${(wait / 1000).toFixed(0)}s`
        );
        if (attempt < retries) await sleep(wait);
        continue;
      }

      throw new Error(`HTTP ${res.status} for ${normalizedUrl}`);
    }

    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
  }

  async fetchHtml(url: string, retries = 6): Promise<string> {
    return (await this.fetch(url, retries)).html;
  }
}
