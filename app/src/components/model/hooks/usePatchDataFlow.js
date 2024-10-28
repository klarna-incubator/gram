import { useDispatch } from "react-redux";
import { patchDataFlow } from "../../../actions/model/patchDataFlow";

export function usePatchDataFlow(id) {
  const dispatch = useDispatch();

  return (newProps) => {
    dispatch(patchDataFlow(id, { ...newProps }));
  };
}
