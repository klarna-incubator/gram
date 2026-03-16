import { PERMISSIONS } from "../components/model/constants";
import { useHasModelPermissions } from "./useHasModelPermissions";

/**
 * Returns true if the user can add a link for the current model.
 * This includes users with ManageLink permission.
 */
export function useCanManageLink() {
  const hasManageLink = useHasModelPermissions(PERMISSIONS.MANAGE_LINK);
  return hasManageLink;
}
