import { api } from "./api";

const teamApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTeam: build.query({
      query: ({ teamId }) => ({
        url: `/teams/${teamId}`,
      }),
      transformResponse: (response, meta, arg) => response.team,
    }),
  }),
});

export const { useGetTeamQuery } = teamApi;
