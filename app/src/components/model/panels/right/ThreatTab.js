import { Box } from "@mui/material";
import { useCreateThreatMutation } from "../../../../api/gram/threats";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useSelectedComponentThreats } from "../../hooks/useSelectedComponentThreats";
import { EditableSelect } from "./EditableSelect";
import { Threat } from "./Threat";
import {
  useAcceptSuggestionMutation,
  useListSuggestionsQuery,
} from "../../../../api/gram/suggestions";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { useModelID } from "../../hooks/useModelID";

export function ThreatTab({ scrollToId, selectedId }) {
  const modelId = useModelID();
  const selectedComponent = useSelectedComponent();
  const [acceptSuggestion] = useAcceptSuggestionMutation();

  const { data: suggestions } = useListSuggestionsQuery(modelId);

  const threatSuggestions = (
    suggestions?.threatsMap[selectedComponent.id] || []
  ).filter((s) => s.status === "new");

  const [createThreat] = useCreateThreatMutation();
  const threats = useSelectedComponentThreats();
  const readOnly = useReadOnly();

  function createNewThreat(threatTitle) {
    createThreat({
      modelId,
      threat: { title: threatTitle, componentId: selectedComponent.id },
    });
  }

  function createSuggestionThreat(suggestion) {
    acceptSuggestion({
      modelId,
      suggestionId: suggestion.id,
    });
  }

  return (
    <Box
      id="panel-right-threats"
      sx={{
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        overflow: "hidden",
      }}
    >
      {!readOnly && (
        <EditableSelect
          placeholder="Add Threat"
          options={threatSuggestions}
          selectExisting={createSuggestionThreat}
          createNew={createNewThreat}
        />
      )}

      <Box
        sx={{
          overflow: "auto",
          gap: "8px",
          display: "flex",
          flexDirection: "column",
          colorScheme: (theme) => theme.palette.mode,
        }}
      >
        {threats.map((threat) => (
          <div id={threat.id} key={threat.id}>
            <Threat
              threat={threat}
              scrollToId={scrollToId}
              selected={selectedId === threat.id}
              hideSeverityDescription={true}
              hideExport={true}
            />
          </div>
        ))}
      </Box>
    </Box>
  );
}
