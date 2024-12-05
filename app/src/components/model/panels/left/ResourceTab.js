import { Box } from "@mui/material";
import { ResourceList } from "./ResourceList";
import { ResourceFilter } from "./ResourceFilter";
import { useState } from "react";
import { useGetResourcesQuery } from "../../../../api/gram/resources";
import { useModelID } from "../../hooks/useModelID";
import { useGetModelQuery } from "../../../../api/gram/model";

export const GROUP_BY = {
  TYPE: { label: "Type", value: "type" },
  SYSTEM_ID: { label: "System Id", value: "systemId" },
};

export function ResourceTab() {
  const [groupBy, setGroupBy] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const modelId = useModelID();
  const {
    data: { systemId },
  } = useGetModelQuery(modelId);

  const { isLoading, isError, data: resources } = useGetResourcesQuery(modelId);

  return (
    <Box
      sx={{
        overflow: "auto",
        height: "100%",
        padding: "1em",
      }}
    >
      {!isLoading && !isError && resources?.length > 0 && (
        <ResourceFilter
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        />
      )}
      <ResourceList
        isLoading={isLoading}
        isError={isError}
        resources={resources}
        groupBy={groupBy}
        searchInput={searchInput}
        systemInScope={systemId}
      />
    </Box>
  );
}
