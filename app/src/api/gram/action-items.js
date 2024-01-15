import { api } from "./api";

const actionItemApi = api.injectEndpoints({
  endpoints: (build) => ({
    listActionItem: build.query({
      query: ({ modelId }) => ({
        url: `/action-items/${modelId}`,
      }),
      transformResponse: (response, meta, arg) => {
        const { actionItems } = response;
        return actionItems;
      },
      providesTags: ["ActionItems"],
    }),
    listExporters: build.query({
      query: () => ({
        url: `/action-items/exporters`,
      }),
      transformResponse: (response, meta, arg) => {
        const { exporterKeys } = response;
        return exporterKeys;
      },
      providesTags: [],
    }),
    exportActionItem: build.mutation({
      query: ({ threatId, exporterKey }) => ({
        url: `/action-items/export`,
        method: "POST",
        body: { threatId, exporterKey },
      }),
      invalidatesTags: (result, error, arg) => [
        "ActionItems",
        { type: "Links", id: `threat-${arg.threatId}` },
      ],
    }),
  }),
});

export const {
  useListActionItemQuery,
  useExportActionItemMutation,
  useListExportersQuery,
} = actionItemApi;
