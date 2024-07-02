import { useDispatch } from "react-redux";
import { setSelected } from "../../../actions/model/setSelected";

export function useSetSelected() {
  const dispatch = useDispatch();

  return (id, value) => {
    dispatch(setSelected(id, value));
  };
}
