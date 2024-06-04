import { api } from "./api";

const searchApi = api.injectEndpoints({
  endpoints: (build) => ({
    search: build.query({
      query: ({ page, types, searchText }) => ({
        url: "/search",
        method: "POST",
        body: {
          page,
          types,
          searchText,
        },
      }),
      transformResponse: (response, meta, arg) => response.results,
    }),
    getSearchTypes: build.query({
      query: () => ({
        url: `/search/types`,
      }),
      transformResponse: (response, meta, arg) => response.searchTypes,
    }),
  }),
});

export const {
  useSearchQuery,
  useLazySearchQuery,
  useGetSearchTypesQuery,
  useLazyGetSearchTypesQuery,
} = searchApi;
