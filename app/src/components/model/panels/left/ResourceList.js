import {
  Stack,
  Typography,
  Box,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Paper,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState } from "react";
import { GROUP_BY } from "./ResourceTab";
import {
  useListMatchingQuery,
  useCreateMatchingMutation,
  useDeleteMatchingMutation,
} from "../../../../api/gram/resource-matching";
import { useModelID } from "../../hooks/useModelID";
import { useGetModelQuery } from "../../../../api/gram/model";

import { useSetSelected } from "../../hooks/useSetSelected";
import { useDeselectAll } from "../../hooks/useSetMultipleSelected";

function capitalizeFirstLetter(string) {
  return string
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function groupResourceBy(resources, groupBy, matchings) {
  if (groupBy === GROUP_BY.TYPE.value || groupBy === GROUP_BY.SYSTEM_ID.value) {
    return Object.groupBy(resources, (resource) => {
      return resource[groupBy] || "Unknown";
    });
  }

  if (groupBy === GROUP_BY.MATCHED.value) {
    let matched = [];
    let unmatched = [];
    let ignored = [];

    resources.forEach((resource) => {
      const matching = matchings.find((m) => m.resourceId === resource.id);
      if (matching) {
        if (matching.componentId) {
          matched.push(resource);
        } else {
          ignored.push(resource);
        }
      } else {
        unmatched.push(resource);
      }
    });
    return { matched, unmatched, ignored };
  }
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

function ListItem({ resource }) {
  return (
    <Typography sx={{ wordBreak: "break-word" }} variant="body1">
      <Typography
        component="span"
        variant="subtitle2"
        sx={{ fontWeight: "bold" }}
      >
        {resource.key}:{" "}
      </Typography>
      <Typography component="span" variant="subtitle2">
        {resource.value}
      </Typography>
    </Typography>
  );
}

function AttributeList({ attributes }) {
  const [showAll, setShowAll] = useState(false);
  const attributeList = Object.entries(attributes).map(([key, value]) => {
    return <ListItem key={key} resource={{ key, value }} />;
  });
  return (
    <>
      {showAll ? attributeList : attributeList.slice(0, 2)}
      {attributeList.length > 2 && (
        <Typography
          sx={{
            marginTop: "0.5em",
            textAlign: "center",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          variant="body2"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "See less" : "See more"}
        </Typography>
      )}
    </>
  );
}

function ResourceListItem({ i, resource, components, matching }) {
  const modelId = useModelID();

  return (
    <Accordion key={i} elevation={10}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{resource.displayName}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: "1px" }}>
        <Box sx={{ display: "flex", gap: "0.3em" }}>
          <MatchResourceWithComponent
            modelId={modelId}
            resource={resource}
            components={components}
            matching={matching}
          />
        </Box>
        <Paper elevation={24} sx={{ padding: "8px", marginTop: "5px" }}>
          <ListItem resource={{ key: "Type", value: resource.type }} />
          <ListItem resource={{ key: "System id", value: resource.systemId }} />
          {resource.attributes && (
            <AttributeList attributes={resource.attributes} />
          )}
        </Paper>
      </AccordionDetails>
    </Accordion>
  );
}

function StandardList({ resources, model, resourceMatchings }) {
  if (resources) {
    return resources.map((resource, i) => {
      const matching = resourceMatchings
        ? resourceMatchings.find((rm) => rm.resourceId === resource.id)
        : null;
      return (
        <ResourceListItem
          i={i}
          resource={resource}
          components={model.data.components}
          matching={matching}
        />
      );
    });
  }
}

function GroupedList({
  groupedResources,
  groupBy,
  systemInScope,
  model,
  resourceMatchings,
}) {
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
          <Box sx={{ display: "flex", gap: "0.3em" }}>
            <Badge
              badgeContent={groupedResources[key].length || "0"}
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
              {capitalizeFirstLetter(key)}
            </Badge>
            {inScopeKeys.includes(key) && (
              <Badge
                sx={{
                  alignItems: "center",
                  gap: "10px",
                  "& span": {
                    position: "relative",
                    transform: "scale(1)",
                    backgroundColor: "dimgray",
                  },
                }}
                badgeContent="scope"
              ></Badge>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: "0 1px" }}>
          <StandardList
            resources={groupedResources[key]}
            model={model}
            resourceMatchings={resourceMatchings}
          />
        </AccordionDetails>
      </Accordion>
    );
  });
}

export function ResourceList({
  groupBy = null,
  isLoading,
  isError,
  resources,
  searchInput,
  systemInScope,
}) {
  const modelId = useModelID();
  const { data: model } = useGetModelQuery(modelId);
  const { data: resourceMatchings } = useListMatchingQuery(modelId);

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
      {groupBy === null ? (
        <StandardList
          resources={resources}
          model={model}
          resourceMatchings={resourceMatchings}
        />
      ) : (
        <GroupedList
          groupBy={groupBy}
          systemInScope={systemInScope}
          groupedResources={groupResourceBy(
            resources,
            groupBy,
            resourceMatchings
          )}
          model={model}
          resourceMatchings={resourceMatchings}
        />
      )}
    </Box>
  );
}

function MatchResourceWithComponent({
  modelId,
  resource,
  components,
  matching,
}) {
  const [createMatching] = useCreateMatchingMutation();
  const [deleteMatching] = useDeleteMatchingMutation();
  const setSelected = useSetSelected();
  const deselectAll = useDeselectAll();
  const [matchedComponent, setMatchedComponent] = useState(null);

  const filteredComponents = components.filter((c) => {
    const typeMap = {
      proc: "process",
      ds: "datastore",
      ee: "external entity",
    };
    return typeMap[c.type] === resource.type.toLowerCase();
  });

  useEffect(() => {
    if (matching) {
      const component = components.find((c) => c.id === matching.componentId);
      setMatchedComponent(component);
    }
  }, [matching, components]);

  function handleChange(e) {
    if (e.target.value === null) {
      console.log("Ignore this resource", {
        modelId: modelId,
        resourceId: resource.id,
        componentId: null,
      });

      createMatching({
        modelId: modelId,
        resourceId: resource.id,
        componentId: null,
      });

      setMatchedComponent(null);
    } else {
      const selectedComponent = components.find((c) => c.id === e.target.value);
      createMatching({
        modelId: modelId,
        resourceId: resource.id,
        componentId: selectedComponent.id,
      });
      setMatchedComponent(selectedComponent);
    }
  }

  function handleDelete(e) {
    deleteMatching({
      modelId,
      resourceId: resource.id,
      componentId: matchedComponent?.id || null,
    });
    setMatchedComponent(null);
  }

  function handleOnClick(e) {
    deselectAll();
    setSelected(matchedComponent.id, true);
  }

  if (matching && matching.componentId === null) {
    return (
      <Box sx={{ marginLeft: "4px" }}>
        <Chip label="Ignored" onDelete={handleDelete} />
      </Box>
    );
  }

  if (!matchedComponent) {
    return (
      <FormControl fullWidth size="small">
        <InputLabel id="match-component-select-label">
          Match with a component
        </InputLabel>
        <Select
          id="match-component-select-label"
          label="Match with a component"
          fullWidth
          value={matchedComponent ? matchedComponent.id : ""}
          onChange={handleChange}
        >
          {filteredComponents &&
            filteredComponents.map((component, idx) => (
              <MenuItem key={idx} value={component.id}>
                {component.name}
              </MenuItem>
            ))}
          ;
          {!filteredComponents && (
            <MenuItem value="">No components found</MenuItem>
          )}
          <MenuItem value={null}>Ignore this resource</MenuItem>
        </Select>
      </FormControl>
    );
  } else {
    return (
      <Box sx={{ marginLeft: "4px" }}>
        <Chip
          label={matchedComponent.name}
          onDelete={handleDelete}
          onClick={handleOnClick}
        />
      </Box>
    );
  }
}
