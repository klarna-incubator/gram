import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
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
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useGetModelPermissionsQuery } from "../../../api/gram/model";
import { useCreateReviewMutation } from "../../../api/gram/review";
import { modalActions } from "../../../redux/modalSlice";
import { LoadingPage } from "../../elements/loading/loading-page/LoadingPage";
import { ReviewerDropdown } from "../../elements/ReviewerDropdown";
import { PERMISSIONS } from "../constants";

export function RequestReview({ modelId }) {
  const dispatch = useDispatch();

  const [reviewedBy, setReviewedBy] = useState(null);

  const [createReview, { isUninitialized, isLoading, isSuccess, isError, error }] = useCreateReviewMutation();

  const { data: permissions, isLoading: permissionsIsLoading } = useGetModelPermissionsQuery({ modelId });
  const writeAllowed = permissions?.includes(PERMISSIONS.WRITE);

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <VisibilityRoundedIcon fontSize="large" />
          <Typography variant="h5">
            {isUninitialized && "Request review"}
            {isLoading && "Requesting review"}
            {isSuccess && "Review requested"}
            {isError && "Request review failed"}
          </Typography>
        </Box>
      </DialogTitle>
      <LoadingPage isLoading={isLoading} />
      <DialogContent sx={{ paddingTop: "0" }}>
        {(isUninitialized || isLoading) && (
          <>
            <DialogContentText>Select who you would like to review your threat model</DialogContentText>
            <ReviewerDropdown modelId={modelId} value={reviewedBy} onChange={setReviewedBy} />
          </>
        )}
        {isSuccess && (
          <>
            <DialogContentText>Your request for review has been registered!</DialogContentText>
            <br />
            <DialogContentText>
              You'll receive an email as a follow-up with feedback on the threat model. Depending on the outcome of the
              review, you may be asked to schedule a threat modeling session.
            </DialogContentText>
          </>
        )}
        {isError && (
          <>
            <DialogContentText variant="h6">Something went wrong :(</DialogContentText>
            <DialogContentText variant="caption">Error: {error}</DialogContentText>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(modalActions.close())} variant="outlined">
          {isUninitialized || isLoading ? "Cancel" : "Close"}
        </Button>
        {(isUninitialized || isLoading) && (
          <Button
            onClick={() => createReview({ modelId, reviewedBy })}
            disabled={isLoading || permissionsIsLoading || !writeAllowed}
            variant="contained"
          >
            Request
            {isLoading && <CircularProgress size={20} sx={{ position: "absolute" }} />}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
