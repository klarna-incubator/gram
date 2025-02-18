import { api } from "./api";

const resourceMatchingApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMatching: build.query({
      query: (modelId) => `/resources-matching/${modelId}`,
      transformResponse: (response) => {
        return response;
      },
      providesTags: ["ResourceMatchings"],
    }),
    createMatching: build.mutation({
      query: ({ modelId, resourceId, componentId }) => ({
        url: `/resources-matching/${modelId}`,
        method: "POST",
        body: { resourceId, componentId },
      }),
      transformResponse: (response) => response,
      invalidatesTags: ["ResourceMatchings"],
    }),
    deleteMatching: build.mutation({
      query: ({ modelId, resourceId, componentId }) => ({
        url: `/resources-matching/${modelId}`,
        method: "DELETE",
        body: { resourceId, componentId },
      }),
      transformResponse: (response) => response,
      invalidatesTags: ["ResourceMatchings"],
    }),
  }),
});

export const { useListMatchingQuery } = resourceMatchingApi;
export const { useCreateMatchingMutation } = resourceMatchingApi;
export const { useDeleteMatchingMutation } = resourceMatchingApi;
