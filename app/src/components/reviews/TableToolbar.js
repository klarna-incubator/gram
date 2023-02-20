import { CheckRounded } from "@mui/icons-material";
import {
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { useGetSystemPropertyDefinitionsQuery } from "../../api/gram/system-properties";
import { ReviewerDropdown } from "../elements/ReviewerDropdown";
import { reviewStatuses } from "./Reviews";

export function TableToolbar(props) {
  const {
    selectedStatuses,
    selectedProperties,
    onStatusFilterChange,
    onPropertyFilterChange,
    onReviewerSelected,
    reviewedBy,
  } = props;

  const { data: systemProperties } = useGetSystemPropertyDefinitionsQuery();

  return (
    <Toolbar style={{ display: "block", padding: "16px 16px" }}>
      <Typography variant={"h5"}>Reviews</Typography>
      <br />
      <Box
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <Typography variant={"b"}>Status</Typography>
        <Box
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {reviewStatuses.map((status) => {
            let selected = selectedStatuses.find((s) => s === status.value);

            if (selected) {
              return (
                <Chip
                  key={status.value}
                  label={status.label}
                  icon={<CheckRounded />}
                  onClick={() => onStatusFilterChange(status.value, false)}
                />
              );
            }
            return (
              <Chip
                key={status.value}
                label={status.label}
                variant={"outlined"}
                onClick={() => onStatusFilterChange(status.value, true)}
              />
            );
          })}
        </Box>

        <Typography variant={"b"}>Property</Typography>
        <Box
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {systemProperties &&
            systemProperties
              .filter((prop) => prop.type === "toggle")
              .map((prop) => {
                let selected = selectedProperties.find((s) => s.id === prop.id);

                if (selected?.value === "true") {
                  return (
                    <Chip
                      key={prop.id}
                      label={prop.label}
                      icon={<CheckRounded />}
                      onClick={() => onPropertyFilterChange(prop, "false")}
                    />
                  );
                }
                return (
                  <Chip
                    key={prop.id}
                    label={prop.label}
                    variant={"outlined"}
                    onClick={() => onPropertyFilterChange(prop, "true")}
                  />
                );
              })}

          {systemProperties &&
            systemProperties
              .filter((prop) => prop.type === "radio")
              .map((prop) => {
                let selected = selectedProperties.find((s) => s.id === prop.id);

                return (
                  <FormControl sx={{ m: 1, minWidth: 120 }}>
                    <InputLabel>{prop.label}</InputLabel>
                    <Select
                      key={prop.id}
                      label={prop.label}
                      color={"primary"}
                      size="small"
                      variant="outlined"
                      onChange={(e) =>
                        onPropertyFilterChange(prop, e.target.value)
                      }
                      value={selected?.value || -1}
                    >
                      <MenuItem value={-1}>Any</MenuItem>
                      {prop.values.map((val) => (
                        <MenuItem value={val}>{val}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              })}
        </Box>
        <Box
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <ReviewerDropdown
            onChange={onReviewerSelected}
            anyOption={true}
            value={reviewedBy}
          />
        </Box>
      </Box>
    </Toolbar>
  );
}
