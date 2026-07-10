/**
 * GoodTherapy browser session.
 *
 * GoodTherapy's /next/api/* endpoints sit behind a live Cloudflare challenge.
 * A plain HTTP client (undici, curl, etc.) gets served the JS challenge page
 * forever. A real browser passes it — but only if its fingerprint is left
 * alone: overriding the User-Agent (without matching Sec-CH-UA/client-hints)
 * makes the challenge fail every time. So:
 *
 *  - patchright (a Playwright fork that hides the automation CDP fingerprint)
 *  - default UA / viewport / headers — do not override them
 *  - drive the real search UI (type location, pick an autocomplete
 *    suggestion, click Search) rather than guessing the POST body, so the
 *    request is byte-for-byte what a real user's browser would send
 *  - fetch profile JSON via `fetch()` executed inside the page (same-origin,
 *    reuses the page's already-cleared session) instead of a fresh request
 *  - run headed (a real, visible Chromium window), not headless — empirically,
 *    /find-therapist clears the challenge fine headless, but the actual search
 *    results route (/next/search, which /next/api/search/location-based hangs
 *    off) gets stuck on the challenge forever in headless mode and passes
 *    immediately in headed mode. Needs a real display (works fine on a normal
 *    desktop; won't work over a headless SSH session with no X/Wayland/macOS UI).
 */

import { chromium, type Browser, type BrowserContext, type Page } from "patchright";
import type { GtListingMember, GtSearchState } from "./types.js";

const BASE = "https://www.goodtherapy.org";
const SEARCH_URL = `${BASE}/next/api/search/location-based`;

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function jitter(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function waitForChallenge(page: Page, maxWaitMs = 45_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const title = await page.title().catch(() => "");
    if (!title.includes("Just a moment")) return true;
    await sleep(2000);
  }
  return false;
}

export class GtBrowserSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  constructor(private headless = false) {}

  async open(): Promise<void> {
    this.browser = await chromium.launch({ headless: this.headless });
    // Explicit shared context: browser.newPage() would otherwise open each
    // page in its own isolated incognito context with no shared cookies,
    // so extra tabs opened for concurrency wouldn't carry the cleared
    // Cloudflare session and their fetch()es would fail.
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  private requireContext(): BrowserContext {
    if (!this.context) throw new Error("GtBrowserSession not open — call open() first");
    return this.context;
  }

  private requirePage(): Page {
    if (!this.page) throw new Error("GtBrowserSession not open — call open() first");
    return this.page;
  }

  /** Load the search page and wait out the Cloudflare challenge. Retries with a fresh page on failure. */
  async warmUp(retries = 3): Promise<void> {
    const page = this.requirePage();
    for (let attempt = 1; attempt <= retries; attempt++) {
      await page.goto(`${BASE}/find-therapist`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const ok = await waitForChallenge(page);
      if (ok) {
        console.log("  [browser] warm-up ok — Cloudflare challenge cleared");
        return;
      }
      console.warn(`  [browser] Cloudflare challenge stuck (attempt ${attempt}/${retries}) — retrying`);
      await sleep(jitter(3000, 6000));
    }
    throw new Error("Could not clear Cloudflare challenge during warm-up");
  }

  /**
   * Drives the real search flow: type into the location box, pick the first
   * autocomplete suggestion, click Search, and capture the JSON body of the
   * resulting POST to /next/api/search/location-based (page 1). Also captures
   * the request body + searchid/sessionCookie so later pages can be fetched
   * directly (see fetchSearchPage) without re-driving the UI each time.
   */
  async searchByLocation(
    query: string,
    retries = 3
  ): Promise<{ members: GtListingMember[]; raw: Record<string, unknown>; searchState: GtSearchState }> {
    const page = this.requirePage();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (!page.url().includes("/find-therapist")) {
          await page.goto(`${BASE}/find-therapist`, { waitUntil: "domcontentloaded", timeout: 60_000 });
          if (!(await waitForChallenge(page))) throw new Error("challenge stuck before search");
        }

        const input = page.locator("#search-location-input").first();
        await input.click();
        await input.fill("");
        // The autocomplete's debounce can eat a fast keystroke and fire the
        // suggestions request on a truncated value — verify and retype if so.
        for (let typeAttempt = 1; typeAttempt <= 3; typeAttempt++) {
          await input.type(query, { delay: jitter(100, 220) });
          await sleep(300);
          if ((await input.inputValue()) === query) break;
          await input.fill("");
        }
        await page.waitForSelector("#suggestions-list > div", { timeout: 10_000 });
        await sleep(jitter(600, 1100));

        // Google Places autocomplete ranks suggestions by proximity to the
        // machine's own IP over textual relevance, and a naive substring match
        // against a zip query also matches unrelated street addresses that
        // happen to start with the same digits (e.g. "10001 Lima Road"). For a
        // zip/postal-code-shaped query, require the code to appear as its own
        // "city, state ZIP" suffix rather than as a street number prefix.
        const suggestions = page.locator("#suggestions-list > div");
        const texts = await suggestions.allTextContents();
        const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const looksLikeZip = /^[\w -]{3,10}$/.test(query.trim()) && /\d/.test(query);
        const zipSuffixRe = looksLikeZip ? new RegExp(`\\b${escaped}\\s*(,|$)`, "i") : null;

        let pickIndex = zipSuffixRe ? texts.findIndex((t) => zipSuffixRe.test(t)) : -1;
        if (pickIndex === -1) pickIndex = texts.findIndex((t) => t.toLowerCase().includes(query.toLowerCase()));
        if (pickIndex === -1) pickIndex = 0;
        console.log(`  [browser] search suggestions: ${JSON.stringify(texts)} — picking [${pickIndex}]`);

        const responsePromise = page.waitForResponse(
          (res) => res.url().includes("/next/api/search/location-based") && res.request().method() === "POST",
          { timeout: 20_000 }
        );

        await suggestions.nth(pickIndex).click();
        await sleep(jitter(300, 700));
        await page.locator('button:has-text("Search")').first().click();

        const response = await responsePromise;
        const raw = (await response.json()) as Record<string, unknown>;
        const members = (Array.isArray(raw.members) ? raw.members : []) as GtListingMember[];
        const requestBody = JSON.parse(response.request().postData() ?? "{}") as Record<string, unknown>;
        const searchState: GtSearchState = {
          body: requestBody,
          searchid: String(raw.searchid ?? ""),
          sessionCookie: String(raw.sessionCookie ?? ""),
          totalcount: Number(raw.totalcount ?? members.length),
        };
        return { members, raw, searchState };
      } catch (err) {
        console.warn(`  [browser] search attempt ${attempt}/${retries} failed: ${(err as Error).message}`);
        if (attempt === retries) throw err;
        await page.goto(`${BASE}/find-therapist`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await waitForChallenge(page);
        await sleep(jitter(2000, 4000));
      }
    }

    throw new Error(`searchByLocation("${query}") failed after ${retries} attempts`);
  }

  /**
   * Fetches one additional results page directly via same-origin fetch() —
   * no UI re-driving needed. Reuses the searchid/sessionCookie from the first
   * page's response and excludeIds to avoid re-seeing already-fetched members
   * (GoodTherapy's own pagination convention, confirmed by inspecting its
   * client bundle's request shape).
   */
  async fetchSearchPage(
    searchState: GtSearchState,
    pageNum: number,
    excludeIds: number[]
  ): Promise<GtListingMember[]> {
    const page = this.requirePage();
    const body = {
      ...searchState.body,
      page: pageNum,
      searchid: searchState.searchid,
      sessionCookie: searchState.sessionCookie,
      excludeIds,
    };

    const result = await page.evaluate(
      async ({ url, body }) => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) return { ok: false, status: res.status };
          return { ok: true, data: await res.json() };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      },
      { url: SEARCH_URL, body }
    );

    if (!result.ok) {
      throw new Error(`fetchSearchPage(page=${pageNum}) failed: ${JSON.stringify(result)}`);
    }
    const raw = (result as { data: Record<string, unknown> }).data;
    return (Array.isArray(raw.members) ? raw.members : []) as GtListingMember[];
  }

  /**
   * Drives the initial search, then pages through /next/api/search/location-based
   * until `limit` members are collected, `maxPages` listing pages have been
   * fetched (10 results/page), or the site runs out of results — whichever
   * comes first, mirroring Psychology Today's --pages/--limit interplay.
   */
  async searchAllPages(query: string, limit: number, maxPages = 10): Promise<GtListingMember[]> {
    const first = await this.searchByLocation(query);
    const all: GtListingMember[] = [...first.members];
    const excludeIds = all.map((m) => m.id);

    let pageNum = 2;
    while (all.length < limit && all.length < first.searchState.totalcount && pageNum <= maxPages) {
      await sleep(jitter(800, 1800));
      let pageMembers: GtListingMember[];
      try {
        pageMembers = await this.fetchSearchPage(first.searchState, pageNum, excludeIds);
      } catch (err) {
        console.warn(`  [browser] pagination stopped at page ${pageNum}: ${(err as Error).message}`);
        break;
      }
      if (pageMembers.length === 0) break;
      all.push(...pageMembers);
      excludeIds.push(...pageMembers.map((m) => m.id));
      console.log(`  [browser] page ${pageNum} → +${pageMembers.length} (${all.length} total)`);
      pageNum++;
    }

    return all.slice(0, limit);
  }

  /** Fetches a therapist profile JSON via same-origin fetch() inside the given page (default: main page). */
  async fetchProfile(seoFriendly: string, page: Page = this.requirePage()): Promise<Record<string, unknown> | null> {
    const url = `${BASE}/next/api/therapist-profile/${encodeURIComponent(seoFriendly)}?prefetch=true`;

    const result = await page.evaluate(async (u) => {
      try {
        const res = await fetch(u, { headers: { accept: "application/json" } });
        if (!res.ok) return { ok: false, status: res.status };
        return { ok: true, data: await res.json() };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    }, url);

    if (!result.ok) {
      console.warn(`  [browser] profile fetch failed for ${seoFriendly}: ${JSON.stringify(result)}`);
      return null;
    }
    return (result as { data: Record<string, unknown> }).data;
  }

  /**
   * Fetches many profiles in parallel using `concurrency` browser tabs. A
   * shared cookie jar alone isn't enough for a new tab's fetch() to pass
   * Cloudflare — each tab is challenged independently, so every extra tab
   * has to actually navigate the real site (and clear the challenge) first,
   * same as the main page's warmUp(), before it's trusted to make requests.
   * Calls `onEach` as each profile completes for incremental progress.
   */
  async fetchProfilesConcurrent(
    seoFriendlyList: string[],
    concurrency: number,
    onEach?: (seoFriendly: string, data: Record<string, unknown> | null, doneCount: number) => void
  ): Promise<Map<string, Record<string, unknown> | null>> {
    const context = this.requireContext();

    const workerCount = Math.max(1, Math.min(concurrency, seoFriendlyList.length));
    const extraPages: Page[] = [];
    for (let i = 1; i < workerCount; i++) {
      const p = await context.newPage();
      await p.goto(`${BASE}/find-therapist`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const ok = await waitForChallenge(p);
      if (!ok) console.warn(`  [browser] extra tab ${i} stuck on Cloudflare challenge — its fetches may fail`);
      extraPages.push(p);
      await sleep(jitter(500, 1200));
    }
    const pages = [this.requirePage(), ...extraPages];

    const results = new Map<string, Record<string, unknown> | null>();
    let idx = 0;
    let done = 0;

    const worker = async (page: Page) => {
      while (idx < seoFriendlyList.length) {
        const i = idx++;
        if (i > 0) await sleep(jitter(1000, 2200));
        const seoFriendly = seoFriendlyList[i];
        let data = await this.fetchProfile(seoFriendly, page);
        if (data === null) {
          await sleep(jitter(1500, 3000));
          data = await this.fetchProfile(seoFriendly, page);
        }
        results.set(seoFriendly, data);
        done++;
        onEach?.(seoFriendly, data, done);
      }
    };

    await Promise.all(pages.map(worker));
    await Promise.all(extraPages.map((p) => p.close()));

    return results;
  }
}
