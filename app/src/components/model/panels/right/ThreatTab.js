import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { useCreateThreatMutation } from "../../../../api/gram/threats";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useSelectedComponentThreats } from "../../hooks/useSelectedComponentThreats";
import { EditableSelect } from "./EditableSelect";
import { Threat } from "./Threat";

const STRIDE = [
  {
    title: "Spoofing",
    description:
      "Threat of an attacker impersonating an existing user in a system.",
    partialSuggestionId: "/stride/threat/spoofing",
  },
  {
    title: "Tampering",
    description:
      "Modifying state or data within a system by manipulating parameters or information on-the-fly.",
    partialSuggestionId: "/stride/threat/tampering",
  },
  {
    title: "Repudiation",
    description: "Ability of a malicious actor to deny actions done.",
    partialSuggestionId: "/stride/threat/repudiation",
  },
  {
    title: "Information Disclosure",
    description:
      "Exfiltration of data not intended for the attacker or current consumer.",
    partialSuggestionId: "/stride/threat/information-disclosure",
  },
  {
    title: "Denial of Service",
    description:
      "Threat of degrading or completely removing the availability of the system.",
    partialSuggestionId: "/stride/threat/denial-of-service",
  },
  {
    title: "Elevation of Privilege",
    description:
      "Being able to abuse or bypass access controls to be able to do actions not intended for the original role.",
    partialSuggestionId: "/stride/threat/elevation-of-privilege",
  },
];

export function ThreatTab(props) {
  const { scrollToId, selectedId } = props;

  const [createThreat] = useCreateThreatMutation();
  const { modelId, componentId } = useSelector(({ model }) => {
    const component = model.components.find((c) => c.id in model.selected);

    return {
      modelId: model.id,
      componentId: component ? component.id : "",
    };
  });
  const threats = useSelectedComponentThreats();
  const readOnly = useReadOnly();

  function createNewThreat(threatTitle) {
    createThreat({ modelId, threat: { title: threatTitle, componentId } });
  }

  function createSTRIDEThreat(threat) {
    createThreat({ modelId, threat: { ...threat, componentId } });
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
          options={STRIDE}
          selectExisting={createSTRIDEThreat}
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
            />
          </div>
        ))}
      </Box>
    </Box>
  );
}
