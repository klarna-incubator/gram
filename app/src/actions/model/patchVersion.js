export const PATCH_VERSION = "PATCH_VERSION";

export function patchVersion(id, version) {
  return (dispatch) => {
    dispatch({
      type: PATCH_VERSION,
      id,
      version,
    });
  };
}
