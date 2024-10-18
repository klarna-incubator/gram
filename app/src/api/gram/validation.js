import { api } from "./api";

const validationApi = api.injectEndpoints({
  endpoints: (build) => ({
    validate: build.query({
      query: (modelId) => `/validate/${modelId}`,
      transformResponse: (response) => {
        return response;
      },
      providesTags: ["Validation"],
    }),
  }),
});

export const { useValidateQuery } = validationApi;
