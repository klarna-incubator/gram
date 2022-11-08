import { api } from "./api";

const mitigationApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMitigations: build.query({
      query: ({ modelId }) => ({
        url: `/models/${modelId}/mitigations`,
      }),
      transformResponse: (response, meta, arg) => {
        const threatToControls = {};
        const controlsToThreats = {};
        response.mitigations.forEach((m) => {
          if (!(m.threatId in threatToControls)) {
            threatToControls[m.threatId] = [];
          }
          threatToControls[m.threatId] = [
            ...threatToControls[m.threatId],
            m.controlId,
          ];

          if (!(m.controlId in controlsToThreats)) {
            controlsToThreats[m.controlId] = [];
          }
          controlsToThreats[m.controlId] = [
            ...controlsToThreats[m.controlId],
            m.threatId,
          ];
        });
        return {
          mitigations: response.mitigations,
          threatsMap: threatToControls,
          controlsMap: controlsToThreats,
        };
      },
      providesTags: ["Mitigations"],
    }),
    createMitigation: build.mutation({
      query: ({ modelId, controlId, threatId }) => ({
        url: `/models/${modelId}/mitigations`,
        method: "POST",
        body: {
          controlId,
          threatId,
        },
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Mitigations"],
    }),
    deleteMitigation: build.mutation({
      query: ({ modelId, controlId, threatId }) => ({
        url: `/models/${modelId}/mitigations`,
        method: "DELETE",
        body: {
          controlId,
          threatId,
        },
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Mitigations"],
    }),
  }),
});

export const {
  useListMitigationsQuery,
  useCreateMitigationMutation,
  useDeleteMitigationMutation,
} = mitigationApi;
