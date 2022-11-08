import { PERMISSIONS } from "../components/model/constants";
import { useHasModelPermissions } from "./useHasModelPermissions";

export function useReadOnly() {
  return !useHasModelPermissions(PERMISSIONS.WRITE);
}
