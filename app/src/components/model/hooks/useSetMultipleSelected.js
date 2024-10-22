import { useDispatch } from "react-redux";
import { setMultipleSelected } from "../../../actions/model/setSelected";

export function useSetMultipleSelected() {
  const dispatch = useDispatch();

  return (ids) => {
    dispatch(setMultipleSelected(ids));
  };
}

export function useDeselectAll() {
  const dispatch = useDispatch();

  return () => {
    dispatch(setMultipleSelected([]));
  };
}
