import type { ZodType } from "zod";
import { fieldError } from "~/utils/zodErrors";

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodType<T>,
  getValues: () => T,
) {
  const touched = reactive<Record<string, boolean>>({});

  const result = computed(() => schema.safeParse(getValues()));
  const isValid = computed(() => result.value.success);

  function touch(field: string) {
    touched[field] = true;
  }

  function touchAll(fields: string[]) {
    for (const field of fields) touched[field] = true;
  }

  function errorFor(field: string) {
    return computed(() => {
      if (!touched[field] || result.value.success) return undefined;
      return fieldError(result.value.error, field);
    });
  }

  return { isValid, touch, touchAll, errorFor };
}
