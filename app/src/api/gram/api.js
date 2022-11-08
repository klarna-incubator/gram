import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCsrfToken } from "./util/csrf";

export const BASE_URL = `${window.location.origin}`;

// initialize an empty api service that we'll inject endpoints into later as needed
export const api = createApi({
  tagTypes: [
    "Controls",
    "Mitigations",
    "Model",
    "Models",
    "ModelPermissions",
    "Review",
    "Reviewers",
    "Suggestions",
    "System",
    "Threats",
    "User",
  ],
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/v1/`,
    prepareHeaders: async (headers) => {
      const token = await getCsrfToken();
      headers.set("x-csrf-token", token);
      return headers;
    },
  }),
  endpoints: () => ({}),
});
