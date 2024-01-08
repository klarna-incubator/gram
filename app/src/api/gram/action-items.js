import { api } from "./api";

const actionItemApi = api.injectEndpoints({
  endpoints: (build) => ({
    listActionItem: build.query({
      query: ({ modelId }) => ({
        url: `/models/${modelId}/action-items`,
      }),
      transformResponse: (response, meta, arg) => {
        const { actionItems } = response;
        return actionItems;
      },
      providesTags: ["ActionItems"],
    }),
  }),
});

export const { useListActionItemQuery } = actionItemApi;
