import { IosShare as IosShareIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  useExportActionItemMutation,
  useListExportersQuery,
} from "../../../api/gram/action-items";
import { modalActions } from "../../../redux/modalSlice";
import { ErrorLine } from "../../elements/ErrorLine";

export function ExportActionItem({ threatId }) {
  const dispatch = useDispatch();

  const [exporter, setExporter] = useState("");
  const { data: exporters, isLoading, isError } = useListExportersQuery();
  const [exportActionItem, result] = useExportActionItemMutation();

  useEffect(() => {
    if (result.isSuccess) {
      dispatch(modalActions.close());
    }
  }, [result, dispatch]);

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <IosShareIcon fontSize="large" />
          <Typography variant="h5">Export Action Item</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: "0" }}>
        {isLoading && <CircularProgress />}

        {isError && <ErrorLine message={"Error loading exporters"} />}

        {result.error && <ErrorLine message={"Error exporting action item"} />}

        <Typography>Which exporter would you like to use?</Typography>

        <Box sx={{ paddingTop: "10px" }}>
          <Select
            value={exporter}
            onChange={(e) => setExporter(e.target.value)}
            displayEmpty
          >
            {exporters &&
              exporters.map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            <MenuItem value="">
              {isLoading ? <CircularProgress /> : "(select an exporter)"}
            </MenuItem>
          </Select>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => dispatch(modalActions.close())}
          variant="outlined"
        >
          Close
        </Button>
        <Button
          onClick={() => exportActionItem({ threatId, exporterKey: exporter })}
          disabled={result.isLoading || !exporter}
          variant="contained"
        >
          Export
          {result.isLoading && (
            <CircularProgress size={20} sx={{ position: "absolute" }} />
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
