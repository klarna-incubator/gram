import { api } from "./api";

const threatApi = api.injectEndpoints({
  endpoints: (build) => ({
    listThreats: build.query({
      query: ({ modelId }) => ({
        url: `/models/${modelId}/threats`,
      }),
      transformResponse: (response, meta, arg) => {
        const threats = {};
        response.threats.forEach((t) => {
          if (!(t.componentId in threats)) {
            threats[t.componentId] = [];
          }
          threats[t.componentId] = [...threats[t.componentId], t];
        });
        return {
          threats,
        };
      },
      providesTags: ["Threats"],
    }),
    createThreat: build.mutation({
      query: ({ modelId, threat }) => ({
        url: `/models/${modelId}/threats`,
        method: "POST",
        body: threat,
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Threats"],
    }),
    updateThreat: build.mutation({
      query: ({ modelId, id, ...fields }) => ({
        url: `/models/${modelId}/threats/${id}`,
        method: "PATCH",
        body: { ...fields },
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Threats"],
    }),
    deleteThreat: build.mutation({
      query: ({ modelId, id }) => ({
        url: `/models/${modelId}/threats/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Threats"],
    }),
  }),
});

export const {
  useCreateThreatMutation,
  useDeleteThreatMutation,
  useUpdateThreatMutation,
  useListThreatsQuery,
} = threatApi;
