export const PATCH_COMPONENT = "PATCH_COMPONENT";

export const patchComponent = (id, fields) => (dispatch) => {
  dispatch({
    type: PATCH_COMPONENT,
    id,
    fields,
  });
};
