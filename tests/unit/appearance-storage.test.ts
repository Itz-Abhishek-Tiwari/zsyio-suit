import { afterEach, describe, expect, it, vi } from "vitest";
import { savePreferenceCookie } from "../../packages/ui/src/components/appearance-storage";

const writes: string[] = [];
function browser(hostname: string, protocol = "https:") {
  writes.length = 0;
  vi.stubGlobal("window", { location: { hostname, protocol } });
  vi.stubGlobal("document", { set cookie(value: string) { writes.push(value); } });
}
afterEach(() => vi.unstubAllGlobals());

describe("suite appearance cookies", () => {
  it("shares theme and accent across configured subdomains and removes shadowing host cookies", () => {
    browser("notes.zsyio.com");
    savePreferenceCookie("zsyio-theme", "system", ".zsyio.com");
    savePreferenceCookie("zsyio-accent", "violet", ".zsyio.com");
    expect(writes[0]).toContain("Max-Age=0");
    expect(writes[1]).toContain("zsyio-theme=system");
    expect(writes[1]).toContain("; Secure; Domain=zsyio.com");
    expect(writes[3]).toContain("zsyio-accent=violet");
    expect(writes[3]).toContain("Domain=zsyio.com");
  });
  it("uses host cookies on localhost so different app ports share preferences", () => {
    browser("localhost", "http:");
    savePreferenceCookie("zsyio-theme", "dark", "localhost");
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain("zsyio-theme=dark");
    expect(writes[0]).not.toContain("Domain=");
    expect(writes[0]).not.toContain("Secure");
  });
  it("does not assign an unrelated or shared hosting domain", () => {
    browser("preview.vercel.app");
    savePreferenceCookie("zsyio-accent", "blue", "vercel.app");
    savePreferenceCookie("zsyio-theme", "light", "zsyio.com");
    expect(writes.every((cookie) => !cookie.includes("Domain="))).toBe(true);
  });
});
