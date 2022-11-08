import { TodayRounded as TodayRoundedIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useGetModelPermissionsQuery } from "../../../api/gram/model";
import { useRequestReviewMeetingMutation } from "../../../api/gram/review";
import { modalActions } from "../../../redux/modalSlice";
import { LoadingPage } from "../../elements/loading/loading-page/LoadingPage";
import { PERMISSIONS } from "../constants";

export function RequestMeeting({ modelId }) {
  const dispatch = useDispatch();

  const [
    requestReviewMeeting,
    { isUninitialized, isLoading, isSuccess, isError, error },
  ] = useRequestReviewMeetingMutation();

  const { data: permissions, isLoading: permissionsIsLoading } =
    useGetModelPermissionsQuery({ modelId });
  const reviewAllowed = permissions?.includes(PERMISSIONS.REVIEW);

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <TodayRoundedIcon fontSize="large" />
          <Typography variant="h5">
            {isUninitialized && "Request meeting"}
            {isLoading && "Requesting meeting"}
            {isSuccess && "Meeting requested"}
            {isError && "Request meeting failed"}
          </Typography>
        </Box>
      </DialogTitle>
      <LoadingPage isLoading={isLoading} />
      <DialogContent sx={{ paddingTop: "0" }}>
        {(isUninitialized || isLoading) && (
          <DialogContentText>
            When you press request, an email will be sent out to the owning team
            requesting them to book a time with the Secure Development Team.
          </DialogContentText>
        )}
        {isSuccess && (
          <>
            <br />
            <DialogContentText>
              An email has been sent out to the owning team requesting them to
              book a meeting with you.
            </DialogContentText>
          </>
        )}
        {isError && (
          <>
            <DialogContentText variant="h6">
              Something went wrong :(
            </DialogContentText>
            <DialogContentText variant="caption">
              Error: {error}
            </DialogContentText>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => dispatch(modalActions.close())}
          variant="outlined"
        >
          {isUninitialized || isLoading ? "Cancel" : "Close"}
        </Button>
        {(isUninitialized || isLoading) && (
          <Button
            onClick={() => requestReviewMeeting({ modelId })}
            disabled={isLoading || permissionsIsLoading || !reviewAllowed}
            variant="contained"
          >
            Request
            {isLoading && (
              <CircularProgress size={20} sx={{ position: "absolute" }} />
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
