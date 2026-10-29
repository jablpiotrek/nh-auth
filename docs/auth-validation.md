# Auth input validation contract

`front/` and `back/` share zero code (see root [`CLAUDE.md`](../CLAUDE.md)),
so there's no way to import `back/`'s Pydantic schemas into the Nuxt forms.
This file is the single source of truth both sides read by hand. **Whenever
`back/app/schemas/auth.py` changes, update this file in the same change.**

`back/` is always the real gate — it validates independently of anything
`front/` does. `front/`'s client-side checks exist only for instant
feedback before a round-trip; getting them wrong is a UX bug, not a
security one.

## Email — `RegisterRequest` and `LoginRequest`

- Must be structurally valid (`local@domain`, valid domain labels).
  Backend uses Pydantic's `EmailStr` (via `email-validator`); frontend can
  use the native `<input type="email">` constraint or an equivalent regex
  — it doesn't need to match the backend's checker exactly, since the
  backend re-validates regardless.
- Max length: **254 characters** (RFC 5321's practical limit).
- Normalized server-side: trimmed and lowercased before every lookup and
  before storage. Frontend doesn't need to replicate this (backend always
  does it), but trimming client-side avoids a confusing "invalid email"
  error from a stray leading/trailing space.

## Password — register only

Login only requires non-empty, ≤128 chars (see below) — complexity is
checked once, at register, against the one password that gets hashed and
stored.

- Min length: **8**
- Max length: **128**
- Must contain at least one of each:
  - uppercase letter (`A-Z`)
  - lowercase letter (`a-z`)
  - digit (`0-9`)
  - special character — anything that isn't `A-Z`, `a-z`, or `0-9`
    (backend regex: `[^A-Za-z0-9]`)
- No other rules (no blocklist, no breached-password check, no "can't
  equal your email" check) — deliberately minimal, not an oversight.

## Password — login

- Min length: **1**, max length: **128**. No complexity re-check — login
  either matches the stored hash or it doesn't; re-applying the register
  minimum here would reject a correct password if the rule ever changes.

## Error shape on validation failure

Both endpoints return **422 Unprocessable Entity** with FastAPI/Pydantic's
standard body shape: `detail` is a list of per-field errors, each with
`loc` (e.g. `["body", "password"]`), `msg`, and `type`. Captured from this
backend:

```json
// password too short
{"detail":[{"type":"string_too_short","loc":["body","password"],"msg":"String should have at least 8 characters","input":"short","ctx":{"min_length":8}}]}

// password missing a required character class (custom validator)
{"detail":[{"type":"value_error","loc":["body","password"],"msg":"Value error, Password must contain at least one uppercase letter","input":"alllowercase9!","ctx":{"error":{}}}]}

// malformed email
{"detail":[{"type":"value_error","loc":["body","email"],"msg":"value is not a valid email address: An email address must have an @-sign.","input":"not-an-email","ctx":{"reason":"An email address must have an @-sign."}}]}
```

Custom validator failures (the four password character-class checks) are
always `"type": "value_error"` with `msg` prefixed `"Value error, "` —
strip that prefix if you want to show the raw message. Frontend can
either parse `detail[].loc` to map errors onto specific form fields, or
just show the first `msg` generically; either is fine for this kata's
scope.

## Wrong-credentials errors (not validation)

`401 Unauthorized` with `{"detail": "Incorrect email or password"}` for a
wrong password or unknown email at `/auth/login` — deliberately the same
message for both cases, so the frontend shouldn't try to distinguish
"wrong password" from "no such account" from this response.

`409 Conflict` with `{"detail": "Email already registered"}` from
`/auth/register` when the (normalized) email is already taken.
