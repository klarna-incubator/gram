import { PERMISSIONS } from "../components/model/constants";
import { useHasModelPermissions } from "./useHasModelPermissions";

/**
 * Returns true if the user can export action items for the current model.
 * This includes users with ExportActionItem permission.
 */
export function useCanExportActionItems() {
  const hasExportActionItems = useHasModelPermissions(
    PERMISSIONS.EXPORT_ACTION_ITEMS
  );
  return hasExportActionItems;
}
