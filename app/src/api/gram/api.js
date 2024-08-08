import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "./util/authToken";

export const BASE_URL = `${window.location.origin}`;

// initialize an empty api service that we'll inject endpoints into later as needed
export const api = createApi({
  tagTypes: [
    "ActionItems",
    "Controls",
    "Flow",
    "Flows",
    "Mitigations",
    "Model",
    "Models",
    "ModelPermissions",
    "Review",
    "Reviewers",
    "Suggestions",
    "System",
    "Templates",
    "Team",
    "Threats",
    "User",
    "Links",
  ],
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/v1/`,
    prepareHeaders: async (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("authorization", `bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
});
