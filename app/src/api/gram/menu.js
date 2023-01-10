import { api } from "./api";

const menuApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMenu: build.query({
      query: () => `/menu`,
      transformResponse: (response) => response.menu,
    }),
  }),
});

export const { useGetMenuQuery } = menuApi;
