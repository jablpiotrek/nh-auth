import { z } from "zod";

// Mirrors back/app/schemas/auth.py - see docs/auth-validation.md. Messages
// are i18n keys (looked up with t() at render time), not display text.

const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const DIGIT_RE = /\d/;
const SPECIAL_RE = /[^A-Za-z0-9]/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "validation.email.required")
  .max(254, "validation.email.tooLong")
  .pipe(z.email("validation.email.invalid"));

// Login only requires non-empty, <=128 chars - no complexity re-check
// (back/'s LoginRequest doesn't re-validate complexity either).
export const loginPasswordSchema = z
  .string()
  .min(1, "validation.password.required")
  .max(128, "validation.password.tooLong");

export const registerPasswordSchema = z
  .string()
  .min(1, "validation.password.required")
  .min(8, "validation.password.tooShort")
  .max(128, "validation.password.tooLong")
  .refine((v) => UPPERCASE_RE.test(v), "validation.password.uppercase")
  .refine((v) => LOWERCASE_RE.test(v), "validation.password.lowercase")
  .refine((v) => DIGIT_RE.test(v), "validation.password.digit")
  .refine((v) => SPECIAL_RE.test(v), "validation.password.special");

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: registerPasswordSchema,
    repeatPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.repeatPassword) {
      ctx.addIssue({
        code: "custom",
        message: "validation.repeatPassword.mismatch",
        path: ["repeatPassword"],
      });
    }
  });
