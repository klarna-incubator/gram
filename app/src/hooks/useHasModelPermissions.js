import { useGetModelPermissionsQuery } from "../api/gram/model";
import { useModelID } from "../components/model/hooks/useModelID";

export function useHasModelPermissions(...neededPermissions) {
  // get model id
  const modelId = useModelID();

  return useHasModelPermissionsWithId(modelId, ...neededPermissions);
}

/**
 * Needed for e.g. Modals which can't use useParams.
 * @param {*} modelId
 * @param  {...any} neededPermissions
 * @returns
 */
export function useHasModelPermissionsWithId(modelId, ...neededPermissions) {
  // get user permissions of specific model id
  const { data: permissions } = useGetModelPermissionsQuery({ modelId });

  return neededPermissions.reduce(
    (prev, p) => prev && permissions?.includes(p),
    true
  );
}
