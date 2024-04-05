import { api } from "./api";

const systemApi = api.injectEndpoints({
  endpoints: (build) => ({
    listSystems: build.query({
      query: (params) => ({
        url: "/systems",
        params,
      }),
      transformResponse: (response, meta, arg) => response,
      providesTags: (result, error, { statuses, page, order }) =>
        result
          ? [
              ...result.systems.map(({ id }) => ({
                type: "System",
                id,
              })),
              { type: "System", id: "PARTIAL-LIST" },
            ]
          : [{ type: "System", id: "PARTIAL-LIST" }],
    }),
    getSystem: build.query({
      query: ({ systemId }) => ({
        url: `/systems/${systemId}`,
      }),
      transformResponse: (response, meta, arg) => response.system,
    }),
    getSystemPermissions: build.query({
      query: ({ systemId }) => ({
        url: `/systems/${systemId}/permissions`,
      }),
      transformResponse: (response, meta, arg) => response.permissions,
    }),
  }),
});

export const {
  useListSystemsQuery,
  useGetSystemQuery,
  useGetSystemPermissionsQuery,
  useLazyListSystemsQuery,
} = systemApi;
