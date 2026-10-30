import { describe, expect, it } from "vitest";
import { errorKeyFromDetail } from "~/utils/apiErrors";

describe("errorKeyFromDetail", () => {
  it("passes through a known error key from the backend", () => {
    expect(errorKeyFromDetail("errors.auth.invalidCredentials")).toBe(
      "errors.auth.invalidCredentials",
    );
  });

  it("falls back to a generic error for an unrecognized detail", () => {
    expect(errorKeyFromDetail("Internal Server Error")).toBe("errors.generic");
  });

  it("falls back to a generic error when there's no detail at all", () => {
    expect(errorKeyFromDetail(undefined)).toBe("errors.generic");
  });
});
