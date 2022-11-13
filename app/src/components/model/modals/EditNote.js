import { DescriptionRounded as DescriptionRoundedIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetModelPermissionsQuery } from "../../../api/gram/model";
import { useGetReviewQuery, useUpdateReviewMutation } from "../../../api/gram/review";
import { modalActions } from "../../../redux/modalSlice";
import { LoadingPage } from "../../elements/loading/loading-page/LoadingPage";
import { PERMISSIONS } from "../constants";

export function EditNote({ modelId }) {
  const dispatch = useDispatch();

  const { data: review } = useGetReviewQuery({ modelId });

  const { data: permissions, isLoading: permissionsIsLoading } = useGetModelPermissionsQuery({ modelId });
  const reviewAllowed = permissions?.includes(PERMISSIONS.REVIEW);

  const [updateReview, { isUninitialized, isLoading, isSuccess, isError, error }] = useUpdateReviewMutation();

  const [localNote, setLocalNote] = useState("");

  useEffect(() => {
    setLocalNote(review?.note);
  }, [review?.note]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(modalActions.close());
    }
  }, [isSuccess, dispatch]);

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <DescriptionRoundedIcon fontSize="large" />
          {reviewAllowed ? (
            <Typography variant="h5">
              {isUninitialized && "Edit note"}
              {isLoading && "Saving note"}
              {isSuccess && "Saved note"}
              {isError && "Error saving note"}
            </Typography>
          ) : (
            <Typography variant="h5">Note</Typography>
          )}
        </Box>
      </DialogTitle>
      <LoadingPage isLoading={isLoading} />
      <DialogContent sx={{ paddingTop: "0" }}>
        {reviewAllowed && <Typography>Use this field to write down notes, e.g. recommendations.</Typography>}
        <TextField
          fullWidth
          multiline
          minRows={7}
          variant="outlined"
          placeholder="Here you can write a short summary of any major threats found as well as recommended controls to implement."
          disabled={!reviewAllowed || isLoading}
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
        />
        {isError && (
          <>
            <Typography variant="h6">Something went wrong :(</Typography>
            <Typography variant="caption">Error: {error}</Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(modalActions.close())} variant="outlined">
          Close
        </Button>
        <Button
          onClick={() => updateReview({ modelId, note: localNote })}
          disabled={isLoading || permissionsIsLoading || !reviewAllowed}
          variant="contained"
        >
          Save and close
          {isLoading && <CircularProgress size={20} sx={{ position: "absolute" }} />}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
