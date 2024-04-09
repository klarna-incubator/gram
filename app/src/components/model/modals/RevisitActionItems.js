import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { useCloseModal } from "../../../hooks/useCloseModal";
import { ActionItemList } from "../panels/left/ActionItemList";
import { useSetShouldReviewActionItemsMutation } from "../../../api/gram/model";
import { useModelID } from "../hooks/useModelID";

export function RevisitActionItems() {
  const closeModal = useCloseModal();
  const modelId = useModelID();
  const [setShouldReview] = useSetShouldReviewActionItemsMutation();

  useEffect(() => {
    modelId && setShouldReview({ id: modelId, shouldReviewActionItems: false });
  }, [modelId, setShouldReview]);

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="md">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <VisibilityRoundedIcon fontSize="large" />
          <Typography variant="h5">Revisit the action items</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ paddingTop: "0" }}>
        <Typography>
          These threats were marked as action items on from your previous threat
          model. Please review them and mark them as resolved if they are no
          longer relevant.
        </Typography>
        <br />
        <Paper sx={{ padding: "15px" }}>
          <ActionItemList automaticallyExpanded={true} />
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => closeModal()} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
