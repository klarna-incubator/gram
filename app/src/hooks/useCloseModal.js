import { useDispatch } from "react-redux";
import { modalActions } from "../redux/modalSlice";

export function useCloseModal() {
  const dispatch = useDispatch();
  return () => dispatch(modalActions.close());
}
