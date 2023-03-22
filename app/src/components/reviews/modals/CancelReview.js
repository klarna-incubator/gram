import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
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
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetModelPermissionsQuery } from "../../../api/gram/model";
import { useCancelReviewMutation } from "../../../api/gram/review";
import { modalActions } from "../../../redux/modalSlice";
import { LoadingPage } from "../../elements/loading/loading-page/LoadingPage";
import { PERMISSIONS } from "../../model/constants";

export function CancelReview(props) {
  const dispatch = useDispatch();

  const { modelId } = props;

  const { data: permissions, isLoading: permissionsIsLoading } =
    useGetModelPermissionsQuery({ modelId });
  const cancelAllowed = permissions?.includes(PERMISSIONS.WRITE);

  const [
    cancelReview,
    { isUninitialized, isLoading, isSuccess, isError, error },
  ] = useCancelReviewMutation();

  useEffect(() => {
    if (isSuccess) {
      dispatch(modalActions.close());
    }
  }, [isSuccess, dispatch]);

  return (
    <Dialog open={true} scroll="paper" fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <CancelRoundedIcon fontSize="large" />
          <Typography variant="h5">
            {isUninitialized && "Cancel review"}
            {isLoading && "Canceling review"}
            {isSuccess && "Canceled review"}
            {isError && "Error canceling review"}
          </Typography>
        </Box>
      </DialogTitle>
      <LoadingPage isLoading={isLoading} />
      <DialogContent sx={{ paddingTop: "0", marginBottom: "50px" }}>
        {(isUninitialized || isLoading) && (
          <>
            <DialogContentText>
              Are you sure you want to cancel this review? This means it will no
              longer be marked for review.
            </DialogContentText>
            <br />
            <DialogContentText>
              Once a review has been canceled, the owners of the threat model
              can re-request a review again if needed.
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
          Close
        </Button>
        <Button
          onClick={() => cancelReview({ modelId })}
          disabled={isLoading || permissionsIsLoading || !cancelAllowed}
          variant="contained"
        >
          Cancel Review
          {isLoading && (
            <CircularProgress size={20} sx={{ position: "absolute" }} />
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
