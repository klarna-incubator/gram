import AssignmentReturnRoundedIcon from "@mui/icons-material/AssignmentReturnRounded";
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
import { useDeclineReviewMutation } from "../../../api/gram/review";
import { modalActions } from "../../../redux/modalSlice";
import { LoadingPage } from "../../elements/loading/loading-page/LoadingPage";
import { PERMISSIONS } from "../../model/constants";

export function DeclineReview(props) {
  const dispatch = useDispatch();

  const { modelId } = props;

  const { data: permissions, isLoading: permissionsIsLoading } =
    useGetModelPermissionsQuery({ modelId });
  const reviewAllowed = permissions?.includes(PERMISSIONS.REVIEW);

  const [
    declineReview,
    { isUninitialized, isLoading, isSuccess, isError, error },
  ] = useDeclineReviewMutation();

  useEffect(() => {
    if (isSuccess) {
      dispatch(modalActions.close());
    }
  }, [isSuccess, dispatch]);

  return (
    <Dialog open={true} scroll="paper" fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <AssignmentReturnRoundedIcon fontSize="large" />
          <Typography variant="h5">
            {isUninitialized && "Decline review"}
            {isLoading && "Declining review"}
            {isSuccess && "Declined review"}
            {isError && "Error declining review"}
          </Typography>
        </Box>
      </DialogTitle>
      <LoadingPage isLoading={isLoading} />
      <DialogContent sx={{ paddingTop: "0" }}>
        {(isUninitialized || isLoading) && (
          <DialogContentText>
            Are you sure you want to decline this review? This will
            automatically re-assign the review of this threat model to someone
            else.
          </DialogContentText>
        )}
        {isError && (
          <>
            {" "}
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
          onClick={() => declineReview({ modelId })}
          disabled={isLoading || permissionsIsLoading || !reviewAllowed}
          variant="contained"
        >
          Decline
          {isLoading && (
            <CircularProgress size={20} sx={{ position: "absolute" }} />
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
