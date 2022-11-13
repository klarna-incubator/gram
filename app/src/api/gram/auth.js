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
      query: ({ provider, params }) => ({
        url: `/auth/token`,
        params: {
          ...params,
          provider,
        },
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
