import {
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
} from "@mui/icons-material";
import { Badge, Box, Collapse, IconButton, Paper } from "@mui/material";
import { useState } from "react";

export function CollapsePaper({
  title,
  count,
  children,
  defaultExpanded = false,
  sx,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Paper elevation={16} sx={sx}>
      <Box
        display="flex"
        alignItems="center"
        sx={{ paddingLeft: "10px", "&:hover": { cursor: "pointer" } }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setExpanded(!expanded);
          }
        }}
      >
        <Badge
          badgeContent={count}
          onClick={() => setExpanded(!expanded)}
          sx={{
            alignItems: "center",
            gap: "10px",
            "& span": {
              position: "relative",
              transform: "scale(1)",
              backgroundColor: "dimgray",
            },
          }}
        >
          {title}
        </Badge>
        <IconButton
          disableRipple
          size="large"
          sx={{
            marginLeft: "auto",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />}
        </IconButton>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {children}
      </Collapse>
    </Paper>
  );
}
