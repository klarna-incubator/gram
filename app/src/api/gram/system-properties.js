import { api } from "./api";

const systemPropertyApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSystemPropertyDefinitions: build.query({
      query: () => "/system-properties/",
      transformResponse: (response, meta, arg) => response.properties,
    }),
    getSystemProperties: build.query({
      query: (modelId) => `/system-properties/${modelId}`,
      transformResponse: (response, meta, arg) => response.properties,
    }),
  }),
});

export const {
  useGetSystemPropertiesQuery,
  useGetSystemPropertyDefinitionsQuery,
} = systemPropertyApi;
