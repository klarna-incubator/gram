import React from "react";
import { Typography } from "@mui/material";
import { errorMessage } from "../../api/gram/util/errorStatus";
import { ContactChip } from "./ContactChip";

/**
 * Shown in place of a result when a request fails.
 *
 * Only the status is surfaced: the response body can carry internal detail such
 * as messages and stack traces, which belong in the API logs rather than the
 * UI. There is nothing the user can do about a failure like that, so point them
 * at the team who can look it up instead.
 */
export function RequestError({ error }) {
  return (
    <>
      <Typography variant="h6">Something went wrong :(</Typography>
      <Typography variant="caption" component="p">
        {errorMessage(error)}
      </Typography>
      <Typography variant="caption" component="p">
        Please reach out to <ContactChip size="small" /> for help.
      </Typography>
    </>
  );
}
