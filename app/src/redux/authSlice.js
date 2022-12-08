import { createSlice } from "@reduxjs/toolkit";
import { api } from "../api/gram/api";

const initialState = {
  authenticated: false,
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
