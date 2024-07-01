import { useDispatch } from "react-redux";
import { addComponent } from "../../../actions/model/addComponent";
import { v4 } from "uuid";
import { COMPONENT_SIZE, COMPONENT_TYPE } from "../board/constants";

export function useAddComponent() {
  const dispatch = useDispatch();

  return ({ name, type, x, y }) => {
    const id = v4();

    let width,
      height = undefined;
    if (type === COMPONENT_TYPE.TRUST_BOUNDARY) {
      width = COMPONENT_SIZE.WIDTH * 1.5;
      height = COMPONENT_SIZE.HEIGHT * 1.5;
    }

    dispatch(
      addComponent(
        {
          name,
          type,
          x,
          y,
          width,
          height,
        },
        id
      )
    );

    return id;
  };
}
