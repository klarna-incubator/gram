import { useDispatch } from "react-redux";
import {
  CURSOR_PAN,
  changeCursorMode,
} from "../../../actions/model/controlsToolbarActions";
import { useIsFramed } from "../../../hooks/useIsFramed";
import { useEffect } from "react";

export function useAutomaticallySetCursorToPanOnFramed() {
  const dispatch = useDispatch();
  const isFramed = useIsFramed();

  useEffect(() => {
    if (!isFramed) {
      return;
    }

    // If the app is framed, then the cursor should be set to pan mode as the diagram is simplified
    dispatch(changeCursorMode(CURSOR_PAN));
  }, [dispatch, isFramed]);
}
