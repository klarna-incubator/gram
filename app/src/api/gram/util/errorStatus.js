/**
 * Pulls the HTTP status out of an RTK Query error.
 *
 * `status` holds the status code for a normal response, but is a string tag
 * like "PARSING_ERROR" when the body could not be read as JSON — the code then
 * lives in `originalStatus`. The API returns a JSON body for errors in
 * development and plain text in production, so both shapes occur.
 *
 * Returns undefined when there is no status at all, e.g. a network failure.
 */
export function errorStatus(error) {
  if (!error) return undefined;
  if (Number.isInteger(error.status)) return error.status;
  if (Number.isInteger(error.originalStatus)) return error.originalStatus;
  return undefined;
}
