import type { ZodError } from "zod";

export function fieldError(error: ZodError | undefined, path: string): string | undefined {
  return error?.issues.find((issue) => issue.path.join(".") === path)?.message;
}
