import { describe, expect, it } from "vitest";
import { emailOptions, pickOption, resolveAppEmail } from "./email-broker";
import { pairwiseSubject } from "./subject";
import { appSybilNullifier } from "@/lib/auth/oidc-identifiers";

const SECRET = "x".repeat(32);
const opts = emailOptions({ email: "jona@mail.be", verified: true }, [
  { id: "a1", alias: "jona@rout.be", status: "active" },
  { id: "a2", alias: "old@rout.be", status: "pending" },
]);

describe("email broker", () => {
  it("offers the primary address and only active aliases", () => {
    expect(opts.map((o) => o.email)).toEqual(["jona@mail.be", "jona@rout.be"]);
  });
  it("defaults to the primary address", () => {
    expect(resolveAppEmail(null, opts)?.email).toBe("jona@mail.be");
  });
  it("gives the app the chosen alias", () => {
    expect(resolveAppEmail({ source: "alias", aliasId: "a1" }, opts)?.email).toBe("jona@rout.be");
  });
  it("falls back to primary when the chosen alias is gone", () => {
    expect(resolveAppEmail({ source: "alias", aliasId: "gone" }, opts)?.email).toBe("jona@mail.be");
  });
  it("refuses choices that are not the user's own", () => {
    expect(pickOption("a2", opts)).toBeNull();
    expect(pickOption("someone-else", opts)).toBeNull();
  });
});

describe("app-specific identifiers", () => {
  it("two apps get different IDs for the same person", async () => {
    const a = await pairwiseSubject(SECRET, "app-a.example", "user-1");
    const b = await pairwiseSubject(SECRET, "app-b.example", "user-1");
    expect(a).not.toBe(b);
    expect(await pairwiseSubject(SECRET, "app-a.example", "user-1")).toBe(a);
  });
  it("one-human proof is stable per app and differs between apps", async () => {
    const a1 = await appSybilNullifier(SECRET, "client-a", "human-1");
    expect(await appSybilNullifier(SECRET, "client-a", "human-1")).toBe(a1);
    expect(await appSybilNullifier(SECRET, "client-b", "human-1")).not.toBe(a1);
    expect(a1).not.toContain("human-1");
  });
  it("refuses a short pepper", async () => {
    await expect(appSybilNullifier("short", "c", "h")).rejects.toThrow();
  });
});
