import { Box } from "@mui/material";
import { ActionItemList } from "./ActionItemList";

export function ActionItemTab() {
  return (
    <Box
      sx={{
        overflow: "auto",
        padding: "8px",
      }}
    >
      <ActionItemList />
    </Box>
  );
}
