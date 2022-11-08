import { api } from "./api";

const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAuthParams: build.query({
      query: () => `/auth/params`,
      transformResponse: (response) => response,
    }),
    getUser: build.query({
      query: () => `/user`,
      transformResponse: (response) => response,
      providesTags: ["User"],
    }),
    getGramToken: build.mutation({
      query: ({ provider, credentials }) => ({
        url: `/auth/token`,
        params: {
          provider,
        },
        headers:
          provider === "google"
            ? {
                "x-google-id-token": credentials.idToken,
              }
            : {},
      }),
      transformResponse: (response) => ({ authenticated: true }),
      invalidatesTags: ["User"],
    }),
    logout: build.mutation({
      query: () => ({
        url: `/auth/token`,
        method: "DELETE",
      }),
      transformResponse: (response) => ({ authenticated: false }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetAuthParamsQuery,
  useGetUserQuery,
  useGetGramTokenMutation,
  useLogoutMutation,
} = authApi;
