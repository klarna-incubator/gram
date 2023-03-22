import { api } from "./api";
import { setAuthToken } from "./util/authToken";

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
      transformResponse: (response) => {
        if (response.status === "ok") {
          setAuthToken(response.token);
        }
        return {
          authenticated: response.status === "ok",
        };
      },
      invalidatesTags: ["User"],
    }),
    logout: build.mutation({
      query: () => ({
        url: `/auth/token`,
        method: "DELETE",
      }),
      transformResponse: (response) => {
        setAuthToken(null);
        return { authenticated: false };
      },
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
