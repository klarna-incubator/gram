import { isRejectedWithValue } from "@reduxjs/toolkit";
import { setAuthToken } from "../../api/gram/util/authToken";
import { authActions } from "../authSlice";

/**
 * Catch 401 errors and trigger logout
 */
export const unauthenticatedErrorHandler = (api) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    if (action.payload.originalStatus === 401) {
      console.log("Got 401 from API, meaning token is no longer valid");
      api.dispatch(authActions.unauthenticate());
      setAuthToken(null);
    }
  }

  return next(action);
};
