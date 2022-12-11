import { api } from "./api";

const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBanners: build.query({
      query: () => `/banners`,
      transformResponse: (response) => response.banners,
    }),
  }),
});

export const { useGetBannersQuery } = authApi;
