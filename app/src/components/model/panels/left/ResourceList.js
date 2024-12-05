import {
  Stack,
  Typography,
  Box,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import { GROUP_BY } from "./ResourceTab";

function capitalizeFirstLetter(string) {
  return string
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function groupResourceBy(resources, key) {
  return Object.groupBy(resources, (resource) => {
    return resource[key] || "Unknown";
  });
}

function AttributeList({ attributes }) {
  const [showAll, setShowAll] = useState(false);
  const attributeList = Object.entries(attributes).map(([key, value]) => {
    return (
      <Typography variant="body2" sx={{ pl: "1em" }} key={key}>
        - <strong>{key}:</strong> {value}
      </Typography>
    );
  });
  return (
    <Stack direction="column">
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        Attributes:
      </Typography>
      {showAll ? attributeList : attributeList.slice(0, 2)}
      <Typography
        sx={{ pl: "1em", cursor: "pointer", textDecoration: "underline" }}
        variant="body2"
        onClick={() => setShowAll(!showAll)}
      >
        {showAll ? "See less" : "See more"}
      </Typography>
    </Stack>
  );
}

function StandardList({ resources }) {
  return resources.map((resource, i) => (
    <Accordion key={i} elevation={3}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{resource.displayName}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body1">
          <strong>Id: </strong> {resource.id}
        </Typography>
        <Typography variant="body1">
          <strong>Type: </strong> {resource.type}
        </Typography>
        <Typography variant="body1">
          <strong>System id: </strong> {resource.systemId}
        </Typography>
        {resource.attributes && (
          <AttributeList attributes={resource.attributes} />
        )}
      </AccordionDetails>
    </Accordion>
  ));
}

function reorderResourceKeys(keys, systemInScope, groupBy) {
  if (groupBy === GROUP_BY.SYSTEM_ID.value) {
    let firstItem = [];
    const filteredItems = keys.filter((i) => {
      if (i === systemInScope) {
        firstItem = [i];
        return false;
      }
      return true;
    });
    return [...firstItem, ...filteredItems];
  }
  return keys;
}

function GroupedList({ groupedResources, groupBy, systemInScope }) {
  const inScopeKeys = ["process", "datastore", systemInScope];
  const orderedKeys = reorderResourceKeys(
    Object.keys(groupedResources),
    systemInScope,
    groupBy
  );

  return orderedKeys.map((key) => {
    return (
      <Accordion key={key}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          {inScopeKeys.includes(key) && (
            <Badge
              sx={{
                "& .MuiBadge-badge": {
                  right: -35,
                  top: 6,
                },
              }}
              color="primary"
              badgeContent="in scope"
            >
              {capitalizeFirstLetter(key)}
            </Badge>
          )}
          {!inScopeKeys.includes(key) && capitalizeFirstLetter(key)}
        </AccordionSummary>
        <AccordionDetails>
          <StandardList resources={groupedResources[key]} />
        </AccordionDetails>
      </Accordion>
    );
  });
}

export function ResourceList({
  groupBy,
  isLoading,
  isError,
  resources,
  searchInput,
  systemInScope,
}) {
  if (isLoading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Stack spacing={1}>
          <Typography>Loading resources</Typography>
          <LinearProgress sx={{ width: "100%" }} />
        </Stack>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography>Error loading resources</Typography>
      </Box>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography sx={{ textAlign: "center" }}>
          No resource found for this system.
        </Typography>
      </Box>
    );
  }

  if (searchInput) {
    resources = resources.filter(
      (r) =>
        r.displayName.toLowerCase().includes(searchInput.toLowerCase()) ||
        r.systemId.toLowerCase().includes(searchInput.toLowerCase()) ||
        r.id.toLowerCase().includes(searchInput.toLowerCase())
    );
  }

  return (
    <Box sx={{ marginTop: "2em" }}>
      {groupBy === null && <StandardList resources={resources} />}
      {groupBy && (
        <GroupedList
          groupBy={groupBy}
          systemInScope={systemInScope}
          groupedResources={groupResourceBy(resources, groupBy)}
        />
      )}
    </Box>
  );
}
