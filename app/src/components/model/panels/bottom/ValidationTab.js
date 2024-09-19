import {
  Typography,
  Box,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { useValidateQuery } from "../../../../api/gram/validation";
import { useEffect } from "react";
import { useSetSelected } from "../../hooks/useSetSelected";
import { useDeselectAll } from "../../hooks/useSetMultipleSelected";

function selectElement(type, elementId, setSelected, deselectAll, setTab) {
  deselectAll();
  if (type === "component") {
    setSelected(elementId, true);
    setTab(2);
  }
  if (type === "model") {
    setTab(1);
  }
}

function renderResults(results, setSelected, deselectAll, setTab) {
  const sortedResults = results.toSorted((a, b) => {
    return a.testResult - b.testResult;
  });

  return sortedResults.map((result, index) => {
    const { type, testResult, message, elementName, elementId, ruleName } =
      result;
    let itemText = elementName + " " + ruleName;
    if (!testResult) {
      itemText += " - " + message;
    }

    return (
      <ListItemButton
        key={index}
        onClick={() => {
          selectElement(type, elementId, setSelected, deselectAll, setTab);
        }}
      >
        <ListItemIcon sx={{ color: testResult ? "green" : "red" }}>
          {testResult ? <DoneIcon /> : <CloseIcon />}
        </ListItemIcon>
        <ListItemText primary={itemText} />
      </ListItemButton>
    );
  });
}

export function ValidationTab({ tab, setTab }) {
  const modelId = useModelID();
  const selectedComponent = useSelectedComponent();
  const { data: validation, isLoading } = useValidateQuery(modelId);
  const validationResults = validation?.results || [];
  const setSelected = useSetSelected();
  const deselectAll = useDeselectAll();

  let filteredResults = [];
  if (tab == 0) {
    // TAB.ALL
    filteredResults = validationResults;
  } else if (tab == 1) {
    // TAB.MODEL
    filteredResults = validationResults.filter(
      (result) => result.type === "model"
    );
  } else if (tab == 2) {
    // TAB.SELECTED_COMPONENT
    if (selectedComponent) {
      filteredResults = validationResults.filter(
        (result) => result.elementId === selectedComponent.id
      );
    } else {
      filteredResults = [];
    }
  } else {
    filteredResults = validationResults;
  }

  useEffect(() => {
    if (!selectedComponent) {
      setTab(0);
    } else {
      setTab(2);
    }
  }, [selectedComponent]);

  return (
    <Box>
      {isLoading && <Typography variant="body1">Loading...</Typography>}
      {tab == 2 && !selectedComponent && (
        <Typography variant="body1">
          Select a component to view validation
        </Typography>
      )}
      {validation && !isLoading && (
        <Paper>
          <List dense sx={{ maxHeight: 250, overflow: "auto" }}>
            {renderResults(filteredResults, setSelected, deselectAll, setTab)}
          </List>
        </Paper>
      )}
    </Box>
  );
}
