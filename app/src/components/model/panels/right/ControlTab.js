import { Box } from "@mui/material";
import { useCreateControlMutation } from "../../../../api/gram/controls";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { useSelectedComponentControls } from "../../hooks/useSelectedComponentControls";
import { Control } from "./Control";
import { EditableSelect } from "./EditableSelect";

export function ControlTab(props) {
  const { scrollToId, selectedId } = props;
  const [createControl] = useCreateControlMutation();

  const modelId = useModelID();
  const component = useSelectedComponent();
  const controls = useSelectedComponentControls();

  const readOnly = useReadOnly();

  function createNewControl(controlTitle) {
    createControl({
      modelId,
      control: { title: controlTitle, componentId: component.id },
    });
  }

  function createListedControl(control) {
    createControl({
      modelId,
      control: { ...control, componentId: component.id },
    });
  }

  return (
    <Box
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
          placeholder="Add Control"
          options={[]}
          selectExisting={createListedControl}
          createNew={createNewControl}
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
        {controls.map((control) => (
          <div id={control.id} key={control.id}>
            <Control
              control={control}
              scrollToId={scrollToId}
              selected={selectedId === control.id}
            />
          </div>
        ))}
      </Box>
    </Box>
  );
}
