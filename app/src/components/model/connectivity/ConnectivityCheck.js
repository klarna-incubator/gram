import WifiOffIcon from "@mui/icons-material/WifiOff";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetConfigQuery } from "../../../api/gram/config";
import { realtimeActions } from "../../../redux/realtimeSlice";

const TRANSPORT_LABELS = {
  sse: "Server-Sent Events (SSE)",
  websocket: "WebSocket",
};

function ConnectivityCheck() {
  const dispatch = useDispatch();
  const { data: config } = useGetConfigQuery();
  const transportLabel = TRANSPORT_LABELS[config?.realtimeTransport];
  const { isConnected, isEstablishing, modelId } = useSelector(
    ({ realtime: { isConnected, isEstablishing, modelId } }) => ({
      isConnected,
      isEstablishing,
      modelId,
    })
  );
  const [timeout, setFakeTimeout] = useState(false);
  const [fails, setFails] = useState(0);
  if (isConnected) return <></>;

  return (
    <Dialog
      open={true}
      scroll={"paper"}
      fullWidth
      maxWidth="sm"
      sx={{ zIndex: 1600 }}
    >
      <DialogTitle>
        <WifiOffIcon color="primary" />
        &nbsp; Who broke the internet?
      </DialogTitle>
      <DialogContent>
        <>
          {isEstablishing ||
            (timeout && (
              <Typography>
                <b>*modem noises*</b> connecting...
              </Typography>
            ))}
          {!isEstablishing && !isConnected && !timeout && (
            <>
              <Typography>
                Your real-time connection to the server
                {transportLabel && ` (${transportLabel})`} has timed out or been
                closed remotely. This could be due to bad connectivity, or the
                Gram server having a bad time.
              </Typography>

              {fails > 0 && (
                <>
                  <br />
                  <Typography>Reconnection failed, try again?</Typography>
                </>
              )}

              {/* Unfortunately the error given is not very descriptive. 
              https://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description
              {error && (
                <>
                  <p>Could be due to this error:</p>{" "}
                  <pre>{JSON.stringify(error)}</pre>
                </>
              )} */}
              <br />

              <Button
                variant="contained"
                onClick={() => {
                  dispatch(realtimeActions.establishConnection(modelId));
                  setFakeTimeout(true);
                  setTimeout(() => {
                    setFakeTimeout(false);
                    setFails(fails + 1);
                  }, 5000);
                }}
              >
                attempt to reconnect
              </Button>
            </>
          )}
        </>
      </DialogContent>
    </Dialog>
  );
}
export default ConnectivityCheck;
