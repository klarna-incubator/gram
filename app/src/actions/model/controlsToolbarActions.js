export const CURSOR_POINTER = "CURSOR_POINTER";
export const CURSOR_PAN = "CURSOR_PAN";

export const CHANGE_CURSOR_TYPE = "CHANGE_CURSOR_TYPE";

export const changeCursorMode = (value) => (dispatch) => {
  dispatch({
    type: CHANGE_CURSOR_TYPE,
    value: value,
  });
};
