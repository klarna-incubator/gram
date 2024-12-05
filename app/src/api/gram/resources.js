import { api } from "./api";

const resourceApi = api.injectEndpoints({
  endpoints: (build) => ({
    getResources: build.query({
      query: (modelId) => `/resources/${modelId}`,
      transformResponse: (response) => {
        return response;
      },
      providesTags: ["Resources"],
    }),
  }),
});

export const { useGetResourcesQuery } = resourceApi;
