export const ADD_DATA_FLOW = "ADD_DATA_FLOW";

export const addDataFlow = (dataFlow) => (dispatch) => {
  dispatch({
    type: ADD_DATA_FLOW,
    dataFlow,
  });
};
