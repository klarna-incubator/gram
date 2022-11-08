import { v4 as uuidv4 } from "uuid";
export const ADD_COMPONENT = "ADD_COMPONENT";

export const addComponent = (component, id) => (dispatch) => {
  dispatch({
    type: ADD_COMPONENT,
    component: { ...component, id: id || uuidv4() },
  });
};
