import { api } from "./api";

const controlApi = api.injectEndpoints({
  endpoints: (build) => ({
    listControls: build.query({
      query: ({ modelId }) => ({
        url: `/models/${modelId}/controls`,
      }),
      transformResponse: (response, meta, arg) => {
        const controls = {};
        response.controls.forEach((t) => {
          if (!(t.componentId in controls)) {
            controls[t.componentId] = [];
          }
          controls[t.componentId] = [...controls[t.componentId], t];
        });
        return {
          controls,
        };
      },
      providesTags: ["Controls"],
    }),
    createControl: build.mutation({
      query: ({ modelId, control }) => ({
        url: `/models/${modelId}/controls`,
        method: "POST",
        body: control,
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Controls"],
    }),
    updateControl: build.mutation({
      query: ({ modelId, id, ...fields }) => ({
        url: `/models/${modelId}/controls/${id}`,
        method: "PATCH",
        body: { ...fields },
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Controls"],
    }),
    deleteControl: build.mutation({
      query: ({ modelId, id }) => ({
        url: `/models/${modelId}/controls/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response, meta, arg) => response,
      invalidatesTags: ["Controls"],
    }),
  }),
});

export const {
  useCreateControlMutation,
  useDeleteControlMutation,
  useUpdateControlMutation,
  useListControlsQuery,
} = controlApi;
