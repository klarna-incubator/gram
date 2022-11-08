export const MODEL_CLEAR_REDUX_STATE = "MODEL_CLEAR_REDUX_STATE";

export const modelActions = {
  clearReduxState,
};

function clearReduxState() {
  return (dispatch) => {
    dispatch({
      type: MODEL_CLEAR_REDUX_STATE,
      payload: {},
    });
  };
}
