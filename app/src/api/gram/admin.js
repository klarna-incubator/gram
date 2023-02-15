import { api } from "./api";
import { setAuthToken } from "./util/authToken";

const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    setRoles: build.mutation({
      query: ({ roles }) => ({
        method: "POST",
        url: `/admin/set-roles`,
        body: { roles },
      }),
      transformResponse: (response) => {
        setAuthToken(response.token);
        return {
          roles: response.new_roles,
          authenticated: true,
        };
      },
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useSetRolesMutation } = adminApi;
