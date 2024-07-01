import { useDispatch } from "react-redux";
import { patchComponent } from "../../../actions/model/patchComponent";

export function usePatchComponent(id) {
  const dispatch = useDispatch();

  return (newProps) => {
    dispatch(
      patchComponent(id, {
        ...newProps,
      })
    );

    return id;
  };
}
