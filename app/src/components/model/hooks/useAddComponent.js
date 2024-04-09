import { useDispatch } from "react-redux";
import { addComponent } from "../../../actions/model/addComponent";
import { v4 } from "uuid";

export function useAddComponent() {
  const dispatch = useDispatch();

  return (name, type, x, y) => {
    const id = v4();

    dispatch(
      addComponent(
        {
          name,
          type,
          x,
          y,
        },
        id
      )
    );

    return id;
  };
}
