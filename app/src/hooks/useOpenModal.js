import { useDispatch } from "react-redux";
import { modalActions } from "../redux/modalSlice";

export function useOpenModal() {
  const dispatch = useDispatch();

  return (modalType, props) =>
    dispatch(
      modalActions.open({
        type: modalType,
        props,
      })
    );
}
