import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "~/schemas/auth";

describe("loginSchema", () => {
  it("accepts a real email and password", () => {
    const result = loginSchema.safeParse({ email: "alice@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = loginSchema.safeParse({ email: "", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "alice@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    email: "alice@example.com",
    password: "Correct-Horse-9",
    repeatPassword: "Correct-Horse-9",
  };

  it("accepts a password meeting every rule, with a matching repeat", () => {
    const result = registerSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects a password that's too short", () => {
    const result = registerSchema.safeParse({
      ...base,
      password: "Sh0rt!",
      repeatPassword: "Sh0rt!",
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ["uppercase letter", "alllowercase9!"],
    ["lowercase letter", "ALLUPPERCASE9!"],
    ["digit", "NoDigitsHere!"],
    ["special character", "NoSpecialChar9"],
  ])("rejects a password missing a %s", (_label, password) => {
    const result = registerSchema.safeParse({ ...base, password, repeatPassword: password });
    expect(result.success).toBe(false);
  });

  it("rejects when the repeated password doesn't match", () => {
    const result = registerSchema.safeParse({ ...base, repeatPassword: "Different-Horse-9" });
    expect(result.success).toBe(false);
  });
});
