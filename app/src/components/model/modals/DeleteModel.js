import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ReportGmailerrorredRoundedIcon from "@mui/icons-material/ReportGmailerrorredRounded";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDeleteModelMutation } from "../../../api/gram/model";
import { useHasModelPermissionsWithId } from "../../../hooks/useHasModelPermissions";
import { modalActions } from "../../../redux/modalSlice";
import { PERMISSIONS } from "../constants";

export function DeleteModel({ modelId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [deleteModel, result] = useDeleteModelMutation();
  const deleteAllowed = useHasModelPermissionsWithId(
    modelId,
    PERMISSIONS.DELETE
  );

  useEffect(() => {
    if (result.isSuccess) {
      setTimeout(() => {
        dispatch(modalActions.close());
        navigate(`/models/`);
      }, 5000);
    }
  }, [result, dispatch, navigate]);

  return (
    <Dialog open={true} scroll="paper" fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          {result.isError ? (
            <ReportGmailerrorredRoundedIcon fontSize="large" />
          ) : (
            <DeleteRoundedIcon fontSize="large" />
          )}
          {result.isUninitialized && (
            <Typography variant="h5">Delete Model</Typography>
          )}
          {result.isSuccess && (
            <Typography variant="h5">Model Deleted</Typography>
          )}
          {result.isLoading && (
            <Typography variant="h5">Deleting Model...</Typography>
          )}
          {result.isLoading && <Typography variant="h5">Error</Typography>}
        </Box>
      </DialogTitle>
      <DialogContent>
        <>
          {result.isUninitialized &&
            "Are you sure you want to delete this model? All associated data (threats, components, controls) to the threat model will be deleted."}
          {result.isLoading && "The model is being deleted, please hold on."}
          {result.isSuccess &&
            "The threat model was deleted. You will be redirected shortly. 👋"}
          {result.isError && (
            <>
              <Typography variant="h6">Something went wrong :(</Typography>
              <Typography variant="caption">Error: {result.error}</Typography>
            </>
          )}
        </>
      </DialogContent>
      <DialogActions>
        {!result.isError && result.isUninitialized && (
          <Button
            variant={result.isUninitialized ? "outlined" : "contained"}
            onClick={() => dispatch(modalActions.close())}
          >
            Cancel
          </Button>
        )}
        {(result.isUninitialized || result.isLoading) && (
          <Button
            variant="contained"
            disabled={result.isLoading || !deleteAllowed}
            onClick={() => deleteModel({ id: modelId })}
          >
            Delete
            {result.isLoading && (
              <CircularProgress size={20} sx={{ position: "absolute" }} />
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
