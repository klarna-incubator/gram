import { useDispatch, useSelector } from "react-redux";
import { patchDataFlow } from "../../../actions/model/patchDataFlow";

export function usePatchDataFlow() {
  const dispatch = useDispatch();
  const { dataFlows } = useSelector(({ model }) => ({
    dataFlows: model.dataFlows,
  }));

  return (id, mutator) => {
    const data = dataFlows.find((df) => df.id === id);
    dispatch(patchDataFlow(id, mutator(data)));
  };
}
