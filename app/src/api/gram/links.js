import { api } from "./api";

const linksApi = api.injectEndpoints({
  endpoints: (build) => ({
    listLinks: build.query({
      query: ({ objectType, objectId }) => ({
        url: `/links?objectType=${objectType}&objectId=${objectId}`,
      }),
      transformResponse: (response, meta, arg) => {
        return response.links;
      },
      providesTags: (result, error, arg) => [
        { type: "Links", id: `${arg.objectType}-${arg.objectId}` },
      ],
    }),
    createLink: build.mutation({
      query: ({ objectType, objectId, icon, url, label }) => ({
        url: `/links/`,
        method: "POST",
        body: { objectType, objectId, icon, url, label },
      }),
      transformResponse: (response, meta, arg) => response.link,
      invalidatesTags: (result, error, arg) => [
        { type: "Links", id: `${arg.objectType}-${arg.objectId}` },
      ],
    }),
    deleteLink: build.mutation({
      query: ({ linkId, objectType, objectId }) => ({
        url: `/links/${linkId}`,
        method: "DELETE",
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: (result, error, arg) => [
        { type: "Links", id: `${arg.objectType}-${arg.objectId}` },
      ],
    }),
  }),
});

export const {
  useListLinksQuery,
  useCreateLinkMutation,
  useDeleteLinkMutation,
} = linksApi;
