import { InfoRounded as InfoRoundedIcon } from "@mui/icons-material";
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
  Link,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useGetModelPermissionsQuery } from "../../../api/gram/model";
import { useChangeReviewerMutation } from "../../../api/gram/review";
import { modalActions } from "../../../redux/modalSlice";
import { LoadingPage } from "../../elements/loading/loading-page/LoadingPage";
import { ReviewerDropdown } from "../../elements/ReviewerDropdown";
import { PERMISSIONS } from "../constants";

export function ChangeReviewer({ modelId }) {
  const dispatch = useDispatch();

  const [newReviewer, setNewReviewer] = useState(null);

  const [
    changeReviewer,
    { isUninitialized, isLoading, isSuccess, isError, error },
  ] = useChangeReviewerMutation();

  const { data: permissions, isLoading: permissionsIsLoading } =
    useGetModelPermissionsQuery({ modelId });
  const writeAllowed =
    permissions?.includes(PERMISSIONS.WRITE) ||
    permissions?.includes(PERMISSIONS.REVIEW);

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <VisibilityRoundedIcon fontSize="large" />
          <Typography variant="h5">
            {isUninitialized && "Change reviewer"}
            {isLoading && "Changing reviewer"}
            {isSuccess && "Reviewer changed"}
            {isError && "Change reviewer failed"}
          </Typography>
        </Box>
      </DialogTitle>
      <LoadingPage isLoading={isLoading} />
      <DialogContent sx={{ paddingTop: "0" }}>
        {(isUninitialized || isLoading) && (
          <>
            <DialogContentText>
              Select who you would like to review your threat model
            </DialogContentText>
            <ReviewerDropdown
              modelId={modelId}
              value={newReviewer}
              onChange={setNewReviewer}
            />
          </>
        )}
        {isSuccess && (
          <>
            <DialogContentText>
              Your request for review has been registered!
            </DialogContentText>
            <br />
            <DialogContentText>
              You'll receive an email as a follow-up with feedback on the threat
              model. Depending on the outcome of the review, you may be asked to
              schedule a threat modeling session.
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
            onClick={() => changeReviewer({ modelId, newReviewer })}
            disabled={isLoading || permissionsIsLoading || !writeAllowed}
            variant="contained"
          >
            Change Reviewer
            {isLoading && (
              <CircularProgress size={20} sx={{ position: "absolute" }} />
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
