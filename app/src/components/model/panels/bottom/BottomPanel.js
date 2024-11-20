import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import { ValidationTab } from "./ValidationTab";
import { BottomTabsHeader, TAB } from "./BottomTabsHeader";
import { useState, useEffect } from "react";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";
import { useValidateQuery } from "../../../../api/gram/validation";
import { COMPONENT_TYPE } from "../../board/constants";

export function BottomPanel() {
  const modelId = useModelID();
  const selectedComponent = useSelectedComponent();
  const { data: validation, isLoading } = useValidateQuery(modelId);
  const validationResults = validation?.results || [];
  const { bottomPanelCollapsed } = useSelector(({ model }) => {
    return {
      bottomPanelCollapsed: model.bottomPanelCollapsed,
    };
  });

  const [tab, setTab] = useState(TAB.ALL);
  let allNegativeResults = [];
  let modelResults = [];
  let selectedResults = [];
  let filteredResults = [];

  if (!isLoading) {
    allNegativeResults = validationResults.filter((result) => {
      return !result.testResult;
    });
    modelResults = allNegativeResults.filter(
      (result) => result.type === "model"
    );

    selectedResults = selectedComponent
      ? allNegativeResults.filter(
          (result) => result?.elementId === selectedComponent.id
        )
      : [];
  }

  if (tab === 0) {
    // TAB.ALL
    filteredResults = allNegativeResults;
  } else if (tab === 1) {
    // TAB.MODEL
    filteredResults = modelResults;
  } else if (tab === 2) {
    // TAB.SELECTED_COMPONENT
    if (selectedComponent) {
      filteredResults = selectedResults;
    } else {
      filteredResults = [];
    }
  } else {
    filteredResults = allNegativeResults;
  }

  useEffect(() => {
    if (!selectedComponent && tab === TAB.SELECTED_COMPONENT) {
      setTab(0);
    }
  }, [selectedComponent, tab]);

  if (bottomPanelCollapsed) {
    return <></>;
  }

  return (
    <Box sx={{ gridArea: "bottom", backgroundColor: "rgb(20,20,20)" }}>
      {!isLoading && (
        <>
          <BottomTabsHeader
            tab={tab}
            setTab={setTab}
            allLength={allNegativeResults.length}
            modelLength={modelResults.length}
            selectedLength={selectedResults.length}
            selectedComponent={selectedComponent}
          />
          <ValidationTab
            tab={tab}
            setTab={setTab}
            filteredResults={filteredResults}
            isLoading={isLoading}
            selectedComponent={selectedComponent}
          />
        </>
      )}
      {isLoading && (
        <Typography
          variant="h6"
          sx={{
            textAlign: "center",
          }}
        >
          Loading ...
        </Typography>
      )}
    </Box>
  );
}
