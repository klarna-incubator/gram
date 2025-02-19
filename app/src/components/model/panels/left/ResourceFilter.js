import {
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { GROUP_BY } from "./ResourceTab";
function toggleGroupBy(groupBy, setGroupBy, value) {
  if (groupBy === value) {
    setGroupBy(null);
  } else {
    setGroupBy(value);
  }
}

export function ResourceFilter({
  groupBy,
  setGroupBy,
  searchInput,
  setSearchInput,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "1em",
        marginY: "1em",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: "1em",
          alignItems: "center",
        }}
      >
        <Typography>Group by:</Typography>
        <Box sx={{ display: "flex", gap: "0.5em" }}>
          {Object.values(GROUP_BY).map((gb) => {
            if (groupBy === gb.value) {
              return (
                <Chip
                  key={gb.value}
                  label={gb.label}
                  onClick={() => toggleGroupBy(groupBy, setGroupBy, gb.value)}
                  color="primary"
                />
              );
            }
            return (
              <Chip
                key={gb.value}
                label={gb.label}
                onClick={() => toggleGroupBy(groupBy, setGroupBy, gb.value)}
                variant="outlined"
              />
            );
          })}
        </Box>
      </Box>

      <TextField
        fullWidth
        id="standard-basic"
        placeholder="Search by id, name or system id"
        variant="standard"
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value);
        }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end" onClick={() => setSearchInput("")}>
                <CloseIcon />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
}
