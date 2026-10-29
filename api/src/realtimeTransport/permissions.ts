import { getPermissionsForModel } from "@gram/core/dist/auth/authorization.js";

// Hack to easily mock the permissions for testing.
export const _permissionsInterface = {
  getPermissions: getPermissionsForModel,
};
