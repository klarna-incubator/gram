export const PATCH_DATA_FLOW = "PATCH_DATA_FLOW";

export const patchDataFlow = (id, fields) => (dispatch) => {
  dispatch({
    type: PATCH_DATA_FLOW,
    id,
    fields,
  });
};
