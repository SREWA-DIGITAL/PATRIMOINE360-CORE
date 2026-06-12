import { describe, expect, it } from "vitest";
import { ShelfError } from "./error";
import {
  assertEnterpriseFeature,
  isEnterpriseLicenseType,
  normalizeLicenseType,
} from "./license";

describe("normalizeLicenseType", () => {
  it("defaults to core when the value is missing or unknown", () => {
    expect(normalizeLicenseType()).toBe("core");
    expect(normalizeLicenseType("")).toBe("core");
    expect(normalizeLicenseType("premium")).toBe("core");
  });

  it("accepts enterprise case-insensitively", () => {
    expect(normalizeLicenseType("enterprise")).toBe("enterprise");
    expect(normalizeLicenseType("ENTERPRISE")).toBe("enterprise");
  });
});

describe("isEnterpriseLicenseType", () => {
  it("returns true only for enterprise", () => {
    expect(isEnterpriseLicenseType("enterprise")).toBe(true);
    expect(isEnterpriseLicenseType("core")).toBe(false);
  });
});

describe("assertEnterpriseFeature", () => {
  it("throws a non-captured ShelfError in core mode", () => {
    expect(() => assertEnterpriseFeature("SSO", "core")).toThrow(ShelfError);
  });

  it("allows enterprise mode", () => {
    expect(() =>
      assertEnterpriseFeature("SSO", "enterprise")
    ).not.toThrow();
  });
});
