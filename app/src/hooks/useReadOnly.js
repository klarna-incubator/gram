import { PERMISSIONS } from "../components/model/constants";
import { useHasModelPermissions } from "./useHasModelPermissions";
import { useIsFramed } from "./useIsFramed";

export function useReadOnly() {
  const isFramed = useIsFramed();
  return !useHasModelPermissions(PERMISSIONS.WRITE) || isFramed;
}
