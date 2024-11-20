import {
  Typography,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
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

    let itemText = (
      <Typography key={index}>
        <Typography
          component="span"
          display="inline"
          sx={{ fontStyle: "italic", fontWeight: "bold" }}
        >
          {elementName ? elementName : "Empty name"}
        </Typography>
        <Typography component="span" display="inline">
          {` ${ruleName}`}
        </Typography>
        {!testResult && (
          <Typography
            component="span"
            display="inline"
            sx={{ fontSize: "12px" }}
          >
            {` - ${message}`}
          </Typography>
        )}
      </Typography>
    );

    return (
      <ListItemButton
        sx={{ fontSize: "10px" }}
        key={index}
        onClick={() => {
          selectElement(type, elementId, setSelected, deselectAll, setTab);
        }}
      >
        <ListItemIcon sx={{ color: testResult ? "green" : "red" }}>
          {testResult ? <DoneIcon /> : <CloseIcon />}
        </ListItemIcon>
        <ListItemText disableTypography primary={itemText} />
      </ListItemButton>
    );
  });
}

export function ValidationTab({
  tab,
  setTab,
  filteredResults,
  isLoading,
  selectedComponent,
}) {
  const setSelected = useSetSelected();
  const deselectAll = useDeselectAll();

  if (isLoading) {
    return (
      <Box
        sx={{
          height: 150,
          width: "100%",
          alignContent: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size="3rem" />
      </Box>
    );
  }

  return (
    <>
      {tab === 2 && !selectedComponent && (
        <Box
          sx={{
            height: 150,
            width: "100%",
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
            }}
          >
            Select a component to view validation
          </Typography>
        </Box>
      )}
      {filteredResults && filteredResults.length === 0 && (
        <Box
          sx={{
            height: 150,
            width: "100%",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
            }}
          >
            Good job!
          </Typography>
        </Box>
      )}
      {filteredResults && filteredResults.length > 0 && (
        <Box
          sx={{
            height: 150,
            width: "100%",
          }}
        >
          <List dense sx={{ maxHeight: 150, overflow: "auto" }}>
            {renderResults(filteredResults, setSelected, deselectAll, setTab)}
          </List>
        </Box>
      )}
    </>
  );
}
