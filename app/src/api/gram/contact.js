import { api } from "./api";

const contactApi = api.injectEndpoints({
  endpoints: (build) => ({
    getContact: build.query({
      query: () => `/contact`,
      transformResponse: (response) => response.contact,
    }),
  }),
});

export const { useGetContactQuery } = contactApi;
