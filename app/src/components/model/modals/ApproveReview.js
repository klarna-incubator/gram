import { ThumbUpRounded as ThumbUpRoundedIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetModelPermissionsQuery } from "../../../api/gram/model";
import {
  useApproveReviewMutation,
  useGetReviewQuery,
} from "../../../api/gram/review";
import { modalActions } from "../../../redux/modalSlice";
import { LoadingPage } from "../../elements/loading/loading-page/LoadingPage";
import { PERMISSIONS } from "../constants";

export function ApproveReview({ modelId }) {
  const dispatch = useDispatch();

  const { data: review } = useGetReviewQuery({ modelId });

  const { data: permissions, isLoading: permissionsIsLoading } =
    useGetModelPermissionsQuery({ modelId });
  const reviewAllowed = permissions?.includes(PERMISSIONS.REVIEW);

  const [
    approveReview,
    { isUninitialized, isLoading, isSuccess, isError, error },
  ] = useApproveReviewMutation();

  useEffect(() => {
    setLocalNote(review?.note);
  }, [review?.note]);

  const [localNote, setLocalNote] = useState("");

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <ThumbUpRoundedIcon fontSize="large" />
          <Typography variant="h5">
            {isUninitialized && "Approve threat model"}
            {isLoading && "Approving threat model"}
            {isSuccess && "Threat model approved"}
            {isError && "Error approving threat model"}
          </Typography>
        </Box>
      </DialogTitle>
      <LoadingPage isLoading={isLoading} />
      <DialogContent sx={{ paddingTop: "0" }}>
        {(isUninitialized || isLoading) && (
          <>
            <DialogContentText>
              Do you have any recommendations to the owning team? Your notes
              here will be forwarded via email.
            </DialogContentText>
            <TextField
              fullWidth
              multiline
              minRows={7}
              variant="outlined"
              placeholder="Here you can write a short summary of any major threats found as well as recommended controls to implement."
              disabled={!reviewAllowed}
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
            />
          </>
        )}
        {isSuccess && (
          <>
            <DialogContentText>
              The threat model is now registered as approved!
            </DialogContentText>
            <br />
            <DialogContentText>
              The owners of the threat model will be notified by email which
              also contains the summary of your recommendations.
            </DialogContentText>
            <br />
            <DialogContentText>
              Thank you for your contribution.
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
            onClick={() => approveReview({ modelId, note: localNote })}
            disabled={isLoading || permissionsIsLoading || !reviewAllowed}
            variant="contained"
          >
            Approve
            {isLoading && (
              <CircularProgress size={20} sx={{ position: "absolute" }} />
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
