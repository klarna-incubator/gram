import { api } from "./api";

// What the backend is set up with: the real-time transport it uses and which
// optional features it offers. The config does not change while the backend
// runs, so it is never refetched.
const configApi = api.injectEndpoints({
  endpoints: (build) => ({
    getConfig: build.query({
      query: () => `/config`,
      keepUnusedDataFor: Infinity,
    }),
  }),
});

export const { useGetConfigQuery } = configApi;
