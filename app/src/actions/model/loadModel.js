export const LOAD_MODEL = "LOAD_MODEL";

export function loadModel(model) {
  return (dispatch) => {
    dispatch({
      type: LOAD_MODEL,
      model,
    });
  };
}
