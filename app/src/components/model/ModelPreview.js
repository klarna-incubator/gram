import { Box } from "@mui/material";

export function ModelPreview({ modelId, ...props }) {
  return (
    <Box>
      <iframe
        title="Model Preview"
        {...props}
        src={document.location.origin + "/model/" + modelId}
      ></iframe>
    </Box>
  );
}
