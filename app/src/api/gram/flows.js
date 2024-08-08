import { api } from "./api";

const flowsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listFlows: build.query({
      query: ({ modelId, dataFlowId }) => ({
        url: `/flows/model/${modelId}/dataflow/${dataFlowId}`,
      }),
      transformResponse: (response, meta, arg) => {
        return response.flows;
      },
      providesTags: (result, error, arg) => [
        { type: "Flows", id: `${arg.modelId}-${arg.dataFlowId}` },
        ...result.map((flow) => ({ type: "Flow", id: flow.id })),
      ],
    }),
    createFlow: build.mutation({
      query: ({
        modelId,
        dataFlowId,
        summary,
        originComponentId,
        attributes,
      }) => ({
        url: `/flows/model/${modelId}/dataflow/${dataFlowId}`,
        method: "POST",
        body: { summary, originComponentId, attributes },
      }),
      transformResponse: (response, meta, arg) => response.flow,
      invalidatesTags: (result, error, arg) => [
        { type: "Flows", id: `${arg.modelId}-${arg.dataFlowId}` },
      ],
    }),
    patchFlow: build.mutation({
      query: ({ flowId, summary, originComponentId, attributes }) => ({
        url: `/flows/${flowId}`,
        method: "PATCH",
        body: { summary, originComponentId, attributes },
      }),
      transformResponse: (response, meta, arg) => response,
      // providesTags: (result, error, arg) => [{ type: "Flow", id: arg.flowId }],
      invalidatesTags: (result, error, arg) => [
        { type: "Flow", id: arg.flowId },
        { type: "Flows" },
      ],
    }),
    deleteFlow: build.mutation({
      query: ({ flowId }) => ({
        url: `/flows/${flowId}`,
        method: "DELETE",
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: (result, error, arg) => [{ type: "Flows" }],
    }),
  }),
});

export const {
  useListFlowsQuery,
  useCreateFlowMutation,
  usePatchFlowMutation,
  useDeleteFlowMutation,
} = flowsApi;
