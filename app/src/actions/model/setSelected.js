export const SET_SELECTED = "SET_SELECTED";
export const SET_MULTIPLE_SELECTED = "SET_MULTIPLE_SELECTED";

export const setSelected = (id, value) => (dispatch) => {
  dispatch({
    type: SET_SELECTED,
    id,
    value: !!value,
  });
};

export const setMultipleSelected = (ids) => (dispatch) => {
  dispatch({
    type: SET_MULTIPLE_SELECTED,
    ids: ids || [],
  });
};
