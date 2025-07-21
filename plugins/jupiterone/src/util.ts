export function sanitizeJ1QueryParam(param: string): string {
  return param.replace(/[^a-zA-Z0-9@\.+ \-]/g, "");
}
