import { CheckRounded } from "@mui/icons-material";
import { Chip, Toolbar, Typography } from "@mui/material";
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
              .filter((prop) => prop.batchFilterable)
              .map((prop) => {
                let selected = selectedProperties.find((s) => s === prop.id);

                if (selected) {
                  return (
                    <Chip
                      key={prop.id}
                      label={prop.label}
                      icon={<CheckRounded />}
                      onClick={() => onPropertyFilterChange(prop, false)}
                    />
                  );
                }
                return (
                  <Chip
                    key={prop.id}
                    label={prop.label}
                    variant={"outlined"}
                    onClick={() => onPropertyFilterChange(prop, true)}
                  />
                );
              })}
        </Box>

        <Typography variant={"b"}>Reviewer</Typography>
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
