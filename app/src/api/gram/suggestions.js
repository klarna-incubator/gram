import { api } from "./api";

const suggestionApi = api.injectEndpoints({
  endpoints: (build) => ({
    listSuggestions: build.query({
      query: (modelId) => ({
        url: `/suggestions/${modelId}`,
      }),
      transformResponse: (response, meta, arg) => {
        const controlsMap = {};
        response.controls.forEach((c) => {
          if (!(c.componentId in controlsMap)) {
            controlsMap[c.componentId] = [];
          }
          controlsMap[c.componentId] = [...controlsMap[c.componentId], c];
        });

        const threatsMap = {};
        response.threats.forEach((t) => {
          if (!(t.componentId in threatsMap)) {
            threatsMap[t.componentId] = [];
          }
          threatsMap[t.componentId] = [...threatsMap[t.componentId], t];
        });

        return {
          controlsMap,
          threatsMap,
        };
      },
      providesTags: ["Suggestions"],
    }),
    acceptSuggestion: build.mutation({
      query: ({ modelId, suggestionId }) => ({
        url: `/suggestions/${modelId}/accept`,
        method: "PATCH",
        body: { suggestionId },
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Suggestions", "Threats", "Controls"],
    }),
    rejectSuggestion: build.mutation({
      query: ({ modelId, suggestionId }) => ({
        url: `/suggestions/${modelId}/reject`,
        method: "PATCH",
        body: { suggestionId },
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Suggestions"],
    }),
    resetSuggestion: build.mutation({
      query: ({ modelId, suggestionId }) => ({
        url: `/suggestions/${modelId}/reset`,
        method: "PATCH",
        body: { suggestionId },
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Suggestions"],
    }),
  }),
});

export const {
  useListSuggestionsQuery,
  useAcceptSuggestionMutation,
  useRejectSuggestionMutation,
  useResetSuggestionMutation,
} = suggestionApi;
