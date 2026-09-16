import { createSlice } from "@reduxjs/toolkit";
import { api } from "../api/gram/api";
import { getAuthToken } from "../api/gram/util/authToken";

const initialState = {
  // Seeded from the stored token so the first render already knows whether the
  // authenticated routes exist. Otherwise every reload renders the catch-all
  // 404 until LoginRedirect's effect has run.
  authenticated: getAuthToken() !== null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    unauthenticate: (state, action) => {
      state.authenticated = false;
    },
    authenticate: (state, action) => {
      state.authenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(api.endpoints.getGramToken.matchFulfilled, (state) => {
      state.authenticated = true;
    });
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;
