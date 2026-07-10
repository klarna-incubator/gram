import { IosShare as IosShareIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useLazyExportModelJsonQuery } from "../../../api/gram/model";
import { modalActions } from "../../../redux/modalSlice";
import { ErrorLine } from "../../elements/ErrorLine";
import { useModelID } from "../hooks/useModelID";

function downloadAsJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportModelJson({ modelId }) {
  const dispatch = useDispatch();
  const routeModelId = useModelID();
  const selectedModelId = modelId || routeModelId;
  const [triggerExport, result] = useLazyExportModelJsonQuery();

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <IosShareIcon fontSize="large" />
          <Typography variant="h5">Export Model JSON</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: "0" }}>
        {result.error && <ErrorLine message={"Error exporting model JSON"} />}
        <Typography>
          Export the full model as JSON so you can run external tools and import
          it back later.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => dispatch(modalActions.close())}
          variant="outlined"
        >
          Close
        </Button>
        <Button
          onClick={async () => {
            const payload = await triggerExport({
              id: selectedModelId,
            }).unwrap();
            const now = new Date().toISOString().replace(/[:.]/g, "-");
            downloadAsJson(
              `gram-model-${selectedModelId}-${now}.json`,
              payload
            );
            dispatch(modalActions.close());
          }}
          disabled={result.isFetching}
          variant="contained"
        >
          Export
          {result.isFetching && (
            <CircularProgress size={20} sx={{ position: "absolute" }} />
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
