import { api } from "./api";

const userApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUser: build.query({
      query: () => `/user`,
      transformResponse: (response) => response,
      providesTags: (result) =>
        result ? [{ type: "User", id: result?.sub }] : [],
    }),
    getOtherUserById: build.query({
      query: ({ userId }) => `/user/${encodeURIComponent(userId)}`,
      transformResponse: (response) => response,
      providesTags: (result) =>
        result ? [{ type: "User", id: result?.sub }] : [],
    }),
  }),
});

export const { useGetUserQuery, useGetOtherUserByIdQuery } = userApi;
