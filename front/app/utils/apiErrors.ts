export function errorKeyFromDetail(detail: unknown): string {
  if (typeof detail === "string" && detail.startsWith("errors.")) {
    return detail;
  }
  return "errors.generic";
}
