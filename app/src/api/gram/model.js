import { api } from "./api";

const modelApi = api.injectEndpoints({
  endpoints: (build) => ({
    getModelPermissions: build.query({
      query: ({ modelId }) => `/models/${modelId}/permissions`,
      transformResponse: (response, meta, arg) => response.permissions,
      providesTags: ["ModelPermissions"],
    }),
    getTemplates: build.query({
      query: () => `/models/templates`,
      transformResponse: (response) => response.templates,
      providesTags: ["Templates"],
    }),
    createModel: build.mutation({
      query: ({ version, systemId, sourceModelId }) => ({
        url: "/models/",
        body: {
          version,
          systemId,
          sourceModelId,
        },
        method: "POST",
      }),
      transformResponse: (response) => response.model,
      invalidatesTags: ["Model", "Models"],
    }),
    listModels: build.query({
      query: (params) => ({
        url: `/models/`,
        params,
      }),
      transformResponse: (response) => response.models,
      providesTags: ["Models"],
    }),
    getModel: build.query({
      query: (id) => ({
        url: `/models/${id}`,
      }),
      transformResponse: (response) => response.model,
      providesTags: ["Model"],
    }),
    patchModel: build.mutation({
      query: ({ id, model }) => ({
        url: `/models/${id}`,
        body: model,
        method: "PATCH",
      }),
      transformResponse: (response) => response.model,
    }),
    deleteModel: build.mutation({
      query: ({ id }) => ({
        url: `/models/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response,
      invalidatesTags: ["Model", "Models"],
    }),
    setTemplate: build.mutation({
      query: ({ id, isTemplate }) => ({
        url: `/models/${id}/set-template`,
        body: { isTemplate },
        method: "PATCH",
      }),
      transformResponse: (response) => response,
      invalidatesTags: ["Model", "Models", "Templates"],
    }),
  }),
});

export const {
  useGetModelQuery,
  useGetModelPermissionsQuery,
  useCreateModelMutation,
  useGetTemplatesQuery,
  useListModelsQuery,
  usePatchModelMutation,
  useDeleteModelMutation,
  useSetTemplateMutation,
} = modelApi;
