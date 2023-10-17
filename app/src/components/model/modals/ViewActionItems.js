import { AssignmentTurnedIn as AssignmentTurnedInIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { modalActions } from "../../../redux/modalSlice";
import { ActionItemList } from "./ActionItemList";

export function ViewActionItems({ modelId }) {
  const dispatch = useDispatch();

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <AssignmentTurnedInIcon fontSize="large" />
          <Typography variant="h5">Action Items</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <ActionItemList modelId={modelId} />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => dispatch(modalActions.close())}
          variant="outlined"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
