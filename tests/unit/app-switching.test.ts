import { describe, expect, it } from "vitest";
import { NextRequest } from "../../packages/auth/node_modules/next/server.js";
import { safeCallbackPath } from "../../packages/ui/src/lib/safe-redirect";
import { getAppEntryUrl, getAppUrl } from "../../packages/ui/src/lib/app-urls";
import { createAuthMiddleware } from "../../packages/auth/src/middleware";

describe("safeCallbackPath", () => {
  it("keeps same-origin paths with query and hash", () => {
    expect(safeCallbackPath("/tasks?taskId=42#comments")).toBe("/tasks?taskId=42#comments");
  });

  it.each([
    ["//evil.com"],
    ["/\\evil.com"],
    ["/\\/evil.com"],
    ["https://evil.com"],
    ["javascript:alert(1)"],
    ["/tasks\nSet-Cookie: x=1"],
    ["tasks"],
    [""],
    [null],
    [undefined],
  ])("falls back for %j", (value) => {
    expect(safeCallbackPath(value)).toBe("/");
  });

  it("uses the given fallback", () => {
    expect(safeCallbackPath("//evil.com", "/home")).toBe("/home");
  });
});

describe("suite app URLs", () => {
  it("joins paths with exactly one slash", () => {
    expect(getAppUrl("sales", "/kanban")).toMatch(/[^/]\/kanban$/);
    expect(getAppUrl("sales", "kanban")).toMatch(/[^/]\/kanban$/);
  });

  it("enters another app through its login page with an encoded callback", () => {
    expect(getAppEntryUrl("notes", "/docs?id=1")).toBe(`${getAppUrl("notes")}/login?callbackUrl=%2Fdocs%3Fid%3D1`);
  });
});

describe("auth middleware", () => {
  const middleware = createAuthMiddleware();

  it("keeps the requested page as callbackUrl for signed-out visitors", () => {
    const response = middleware(new NextRequest("https://notes.example.com/docs/abc?tab=history"));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/docs/abc?tab=history");
  });

  it("sends a signed-out visit to the root to a plain /login", () => {
    const response = middleware(new NextRequest("https://notes.example.com/"));
    expect(response.headers.get("location")).toBe("https://notes.example.com/login");
  });
});
