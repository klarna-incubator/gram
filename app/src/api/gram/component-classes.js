import { api } from "./api";

const componentClassesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listComponentClasses: build.query({
      query: (params) => ({
        url: `/component-class`,
        params,
      }),
      transformResponse: (response, meta, arg) => {
        return response.classes;
      },
    }),
  }),
});

export const { useListComponentClassesQuery } = componentClassesApi;
