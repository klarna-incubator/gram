import { UploadFile as UploadFileIcon } from "@mui/icons-material";
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
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useImportModelJsonMutation } from "../../../api/gram/model";
import { modalActions } from "../../../redux/modalSlice";
import { ErrorLine } from "../../elements/ErrorLine";
import { useModelID } from "../hooks/useModelID";

function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch {
        reject(new Error("Invalid JSON file."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsText(file);
  });
}

export function ImportModelJson({ modelId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const routeModelId = useModelID();
  const selectedModelId = modelId || routeModelId;
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState("");
  const [importModelJson, result] = useImportModelJsonMutation();

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <UploadFileIcon fontSize="large" />
          <Typography variant="h5">Import Model JSON</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: "0" }}>
        {localError && <ErrorLine message={localError} />}
        {result.error && <ErrorLine message={"Error importing model JSON"} />}
        <Typography sx={{ marginBottom: "12px" }}>
          Replace current model contents using a previously exported Gram JSON
          file.
        </Typography>

        <Button variant="outlined" component="label">
          Choose JSON file
          <input
            hidden
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const selected = event.target.files?.[0] || null;
              setFile(selected);
              setLocalError("");
            }}
          />
        </Button>
        <Typography sx={{ marginTop: "8px" }}>
          {file ? file.name : "No file selected"}
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
            if (!file) {
              setLocalError("Please choose a JSON file first.");
              return;
            }
            if (!selectedModelId) {
              setLocalError("No target model selected for import.");
              return;
            }
            try {
              const payload = await parseJsonFile(file);
              const importResult = await importModelJson({
                payload,
                targetModelId: selectedModelId,
              }).unwrap();
              dispatch(modalActions.close());
              navigate(`/model/${importResult.modelId}`);
            } catch (error) {
              setLocalError(error?.message || "Failed to import JSON.");
            }
          }}
          disabled={result.isLoading}
          variant="contained"
        >
          Import
          {result.isLoading && (
            <CircularProgress size={20} sx={{ position: "absolute" }} />
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
