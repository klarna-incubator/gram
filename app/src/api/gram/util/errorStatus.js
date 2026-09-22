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

/**
 * Renders an RTK Query error as a string safe to pass to React as a child.
 *
 * An RTK Query error is always an object, so rendering it directly throws
 * "Objects are not valid as a React child". Only the status is surfaced: the
 * response body can carry internal detail such as messages and stack traces,
 * which belong in the API logs rather than the UI.
 */
export function errorMessage(error) {
  if (!error) return undefined;

  const status = errorStatus(error);
  return status ? `Request failed with status ${status}` : "Request failed";
}
