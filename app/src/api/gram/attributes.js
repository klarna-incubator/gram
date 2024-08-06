import { api } from "./api";

const attributeApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFlowAttributes: build.query({
      query: () => `/attributes/flow`,
      transformResponse: (response) => response.attributes,
    }),
  }),
});

export const { useGetFlowAttributesQuery } = attributeApi;
