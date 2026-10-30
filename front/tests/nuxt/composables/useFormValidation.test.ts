import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useFormValidation } from "~/composables/useFormValidation";

const schema = z.object({
  email: z.string().min(1, "validation.email.required").pipe(z.email("validation.email.invalid")),
});

describe("useFormValidation", () => {
  it("is valid once the value satisfies the schema", () => {
    const email = ref("alice@example.com");
    const { isValid } = useFormValidation(schema, () => ({ email: email.value }));

    expect(isValid.value).toBe(true);

    email.value = "not-an-email";
    expect(isValid.value).toBe(false);
  });

  it("hides the error until the field is touched", () => {
    const { errorFor, touch } = useFormValidation(schema, () => ({ email: "" }));
    const emailError = errorFor("email");

    expect(emailError.value).toBeUndefined();

    touch("email");
    expect(emailError.value).toBe("validation.email.required");
  });

  it("touchAll reveals errors on every listed field at once", () => {
    const { errorFor, touchAll } = useFormValidation(schema, () => ({ email: "not-an-email" }));
    const emailError = errorFor("email");

    touchAll(["email"]);
    expect(emailError.value).toBe("validation.email.invalid");
  });
});
