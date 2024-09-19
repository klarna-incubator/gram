export const TOGGLE_RIGHT_PANEL = "TOGGLE_RIGHT_PANEL";
export const TOGGLE_LEFT_PANEL = "TOGGLE_LEFT_PANEL";
export const TOGGLE_BOTTOM_PANEL = "TOGGLE_BOTTOM_PANEL";

export const togglePanel = (type, value) => (dispatch) => {
  dispatch({
    type: type,
    value: value,
  });
};
