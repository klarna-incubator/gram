import Konva from "konva";
import React, { useEffect, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import {
  Provider,
  ReactReduxContext,
  useDispatch,
  useSelector,
} from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addDataFlow } from "../../../actions/model/addDataFlow";
import { CURSOR_PAN } from "../../../actions/model/controlsToolbarActions";
import { copyNodes } from "../../../actions/model/copyNodes";
import { deleteSelected } from "../../../actions/model/deleteSelected";
import { moveComponents } from "../../../actions/model/moveSelected";
import { useListControlsQuery } from "../../../api/gram/controls";
import { useListThreatsQuery } from "../../../api/gram/threats";
import { useIsFramed } from "../../../hooks/useIsFramed";
import { useReadOnly } from "../../../hooks/useReadOnly";
import { modalActions } from "../../../redux/modalSlice";
import { MODALS } from "../../elements/modal/ModalManager";
import Loading from "../../loading";
import { useAddComponent } from "../hooks/useAddComponent";
import { useAutomaticallySetCursorToPanOnFramed } from "../hooks/useAutomaticallySetCursorToPanOnFramed";
import { useAutomaticallySetToCenter } from "../hooks/useAutomaticallySetToCenter";
import { useModelID } from "../hooks/useModelID";
import { useSetMultipleSelected } from "../hooks/useSetMultipleSelected";
import { useSetSelected } from "../hooks/useSetSelected";
import { ActiveUsers } from "../panels/ActiveUsers";
import { ControlsToolBar } from "./components/ControlsToolBar";
import { Grid } from "./components/Grid";
import { SelectionRectangle } from "./components/SelectionRectangle";
import { ToggleLeftPanelButton } from "./components/ToggleLeftPanelButton";
import { ToggleRightPanelButton } from "./components/ToggleRightPanelButton";
import { ContextMenu } from "./components/menu/ContextMenu";
import {
  COMPONENT_SIZE,
  COMPONENT_TYPE,
  CONTEXT_MENU_VARIANT,
  DIALOG,
  STAGE_ACTION,
  ZOOM,
} from "./constants";
import { DataFlow } from "./shapes/DataFlow";
import { DataStore } from "./shapes/DataStore";
import { ExternalEntity } from "./shapes/ExternalEntity";
import { Process } from "./shapes/Process";
import { TrustBoundary } from "./shapes/TrustBoundary";
import { getAbsolutePosition } from "./util";

// Local variables
const componentTypes = {
  ee: ExternalEntity,
  proc: Process,
  ds: DataStore,
  tb: TrustBoundary,
};

function grabbingCursor() {
  document.body.style.cursor = "grabbing";
}

function pointerCursor() {
  document.body.style.cursor = "pointer";
}

function componentSort(a, b) {
  // Order should be based on component size. This determines which component is selected when overlapped components are
  // clicked in the diagram.
  //
  // 1. Non-trust boundary components
  // 2. Smaller Trust Boundary by Area
  // 3. Larger Trust Boundary by Area
  //

  if (
    a.type === COMPONENT_TYPE.TRUST_BOUNDARY &&
    b.type === COMPONENT_TYPE.TRUST_BOUNDARY
  ) {
    let areaA = a.height * a.width;
    let areaB = b.height * b.width;
    return areaB - areaA;
  }

  return (
    (a.type === COMPONENT_TYPE.TRUST_BOUNDARY ? -1 : 1) -
    (b.type === COMPONENT_TYPE.TRUST_BOUNDARY ? -1 : 1)
  );
}

export default function Board() {
  const dispatch = useDispatch();
  const diagramContainerRef = useRef();
  const stageRef = useRef();
  const isFramed = useIsFramed();

  const modelId = useModelID();
  useAutomaticallySetCursorToPanOnFramed();

  const { data: modelThreats } = useListThreatsQuery({ modelId });
  const threats = modelThreats?.threats || {};

  const { data: modelControls } = useListControlsQuery({ modelId });
  const controls = modelControls?.controls || {};

  // Redux variables
  const {
    components,
    dataFlows,
    selected,
    rightPanelCollapsed,
    leftPanelCollapsed,
    cursorType,
  } = useSelector(({ model }) => ({
    components: model.components,
    dataFlows: model.dataFlows,
    selected: model.selected,
    rightPanelCollapsed: model.rightPanelCollapsed,
    leftPanelCollapsed: model.leftPanelCollapsed,
    cursorType: model.cursorType,
  }));

  const readOnly = useReadOnly();

  // States which control if the component updates
  const [stage, setStage] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    scale: 1,
    panning: false,
  });
  const [selectionRectangle, setSelectionRectangle] = useState({
    x: 0,
    y: 0,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  const [lastPointerPosition, setLastPointerPosition] = useState({
    window: {
      x: 0,
      y: 0,
    },
    stage: {
      x: 0,
      y: 0,
    },
  });
  const [stageDialog, setStageDialog] = useState({ type: DIALOG.NONE });
  const [editDataFlow, setEditDataFlow] = useState(false);
  const [clipboard, setClipboard] = useState([]);

  useAutomaticallySetToCenter(setStage, stageRef.current);

  const componentsPosObj = components.reduce(
    (acc, c) => ({ ...acc, [c.id]: { x: c.x, y: c.y } }),
    {}
  );
  // Position of components, kept in state to avoid too many redux updates while moving components which is laggy.
  const [componentsPos, setComponentsPos] = useState(componentsPosObj);
  const jsonComponentsPosObj = JSON.stringify(componentsPosObj);
  useEffect(() => {
    setComponentsPos(componentsPosObj); // Update local state with new component positions if they've been updated from elsewhere
    // eslint-disable-next-line
  }, [components, jsonComponentsPosObj]); // Slight hack to detect changes in components via JSON string comparison

  const setSelected = useSetSelected();
  const setMultipleSelected = useSetMultipleSelected();

  // Resize functionality
  function resize() {
    setStage((prevStage) => ({
      ...prevStage,
      width: diagramContainerRef.current.offsetWidth,
      height: diagramContainerRef.current.offsetHeight,
      action: STAGE_ACTION.RESIZE,
    }));
  }
  var resizeTimeout;
  window.onresize = function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 50);
  };
  useEffect(() => {
    resize();
  }, [rightPanelCollapsed, leftPanelCollapsed]);

  useEffect(() => {
    setStage((prevStage) => ({
      ...prevStage,
      panning: cursorType === CURSOR_PAN,
    }));
  }, [cursorType]);

  // --------------------------------------------------------------------------
  // Event handlers - Input Events
  // --------------------------------------------------------------------------
  function onKeyDown(e) {
    if (e.repeat) {
      return;
    }

    if (e.key === "Escape") {
      hideStageDialog();
      return;
    }

    if (stageDialog.type !== DIALOG.NONE) {
      return;
    }

    if (e.key === " " && !stage.panning) {
      setStage((prevStage) => ({
        ...prevStage,
        panning: true,
      }));
      return;
    }

    if (!readOnly) {
      // Delete
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        Object.keys(selected).length !== 0 &&
        !e.target.tagName.toLowerCase().match(/input|textarea/)
      ) {
        let selectedComponents = components.filter((c) => c.id in selected);
        if (
          selectedComponents.length === 0 ||
          (selectedComponents.length === 1 &&
            !(selectedComponents[0].id in controls) &&
            !(selectedComponents[0].id in threats))
        ) {
          dispatch(deleteSelected());
        } else {
          dispatch(modalActions.open({ type: MODALS.DeleteSelected.name }));
        }
      }

      // Copy/Paste
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        copyComponents();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        pasteComponents();
      }
    }
  }

  function onKeyUp(e) {
    if (e.key === " " && stage.panning) {
      setStage((prevStage) => ({
        ...prevStage,
        panning: false,
      }));
    }
  }

  // close context modal if open
  function onStageMouseDown(e) {
    if (e.target.attrs.isStage) {
      if (stageDialog.type === DIALOG.CONTEXT_MENU) {
        hideStageDialog();
        return;
      }

      if (!stage.panning && e.evt.button === 0) {
        const pos = getStagePointerPosition();
        setSelectionRectangle({
          x: pos.x,
          y: pos.y,
          x1: pos.x,
          y1: pos.y,
          width: 0,
          height: 0,
          visible: true,
        });
      }
    }
  }

  function onStageMouseMove() {
    if (editDataFlow || selectionRectangle.visible) {
      requestAnimationFrame(() => {
        const stagePos = getStagePointerPosition();
        if (editDataFlow) {
          setEditDataFlow((prevNewDataFlow) => ({
            ...prevNewDataFlow,
            points: [
              ...prevNewDataFlow.points.slice(0, -2),
              stagePos.x,
              stagePos.y,
            ],
          }));
        } else if (selectionRectangle.visible) {
          setSelectionRectangle((prevSelectionRectangle) => ({
            ...prevSelectionRectangle,
            x: Math.min(selectionRectangle.x1, stagePos.x),
            y: Math.min(selectionRectangle.y1, stagePos.y),
            x2: stagePos.x,
            y2: stagePos.y,
            width: Math.abs(stagePos.x - selectionRectangle.x1),
            height: Math.abs(stagePos.y - selectionRectangle.y1),
          }));
        }
      });
    }
  }

  function onStageMouseUp(e) {
    if (selectionRectangle.visible) {
      let selectedComponents = [
        ...components.filter((c) =>
          Konva.Util.haveIntersection(selectionRectangle, {
            ...c,
            width: COMPONENT_SIZE.WIDTH,
            height: COMPONENT_SIZE.HEIGHT,
          })
        ),
      ].reduce((a, s) => ({ ...a, [s.id]: true }), {});

      if (e.evt.shiftKey) {
        selectedComponents = { ...selected, ...selectedComponents };
      } else if (e.evt.ctrlKey || e.evt.metaKey) {
        selectedComponents = Object.keys(selected)
          .filter((s) => !(s in selectedComponents))
          .reduce((a, s) => ({ ...a, [s]: true }), {});
      }
      setMultipleSelected(Object.keys(selectedComponents));
      setSelectionRectangle({
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        width: 0,
        height: 0,
        visible: false,
      });
    }
  }

  function zoomInCenter(direction) {
    var pointer = {
      x: stage.width / 2,
      y: stage.height / 2,
    };
    zoomControl(direction, pointer);
  }

  function zoomControl(direction, pointer) {
    var newScale = Math.max(
      ZOOM.MIN,
      Math.min(
        ZOOM.MAX,
        direction < 0
          ? stage.scale * ZOOM.SCALE_BY
          : stage.scale / ZOOM.SCALE_BY
      )
    );

    const mousePointTo = {
      x: (pointer.x - stage.x) / stage.scale,
      y: (pointer.y - stage.y) / stage.scale,
    };

    const newStagePos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStage((prevStage) => ({
      ...prevStage,
      scale: newScale,
      x: newStagePos.x,
      y: newStagePos.y,
      action: STAGE_ACTION.WHEEL,
    }));
  }

  function onStageWheel(e) {
    // Prevent browser from scaling the entire page
    e.evt.preventDefault();
    //e.stopPropagation(); maybe helps prev page issue
    if (stageDialog.type === DIALOG.CONTEXT_MENU) {
      hideStageDialog();
      return;
    }

    // Ctrl or Cmd zooms
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const pointer = stageRef.current.getPointerPosition();
      zoomControl(e.evt.deltaY, pointer);
    } else {
      setStage((prevStage) => ({
        ...prevStage,
        x: prevStage.x - e.evt.deltaX,
        y: prevStage.y - e.evt.deltaY,
        action: STAGE_ACTION.DRAG,
      }));
    }
  }

  function onStageClick(e) {
    // If not left click
    if (e.evt.button !== 0) {
      return;
    }

    if (editDataFlow) {
      const { x, y } = getStagePointerPosition();
      setEditDataFlow((prevEditDataFlow) => ({
        ...prevEditDataFlow,
        points: [...prevEditDataFlow.points, x, y],
      }));
    } else {
      hideStageDialog();
    }
  }

  function onDataFlowClick(id) {
    return function (e) {
      // If not left click
      if (e.evt.button !== 0) {
        return;
      }

      if (e.evt.shiftKey) {
        setSelected(id, true);
      } else if (e.evt.ctrlKey || e.evt.metaKey) {
        setSelected(id, false);
      } else {
        setMultipleSelected([id]);
      }
    };
  }

  function onComponentClick(id) {
    return function (e) {
      // If not left click
      if (e.evt.button !== 0) {
        return;
      }

      const component = components.find((c) => c.id === id);

      if (
        editDataFlow &&
        !readOnly &&
        component &&
        component?.type !== COMPONENT_TYPE.TRUST_BOUNDARY
      ) {
        onMagnetClick(id)();
        return;
      }

      if (e.evt.shiftKey) {
        setSelected(id, true);
      } else if (e.evt.ctrlKey || e.evt.metaKey) {
        setSelected(id, false);
      } else {
        setMultipleSelected([id]);
      }
    };
  }

  function onMagnetClick(componentId) {
    return function () {
      // Starting a new dataFlow
      if (!editDataFlow) {
        const pointerPos = getStagePointerPosition();
        setEditDataFlow({
          id: uuidv4(),
          points: [
            componentsPos[componentId].x,
            componentsPos[componentId].y,
            pointerPos.x,
            pointerPos.y,
          ],
          startComponent: {
            id: componentId,
          },
          endComponent: {},
        });
      } else {
        if (componentId === editDataFlow.startComponent.id) return;
        // Clicking a magnet with a dataFlow already defined =>
        // the dataFlow should finish.
        editDataFlow.endComponent = {
          id: componentId,
        };

        dispatch(addDataFlow(editDataFlow));
        setEditDataFlow(false);
      }
    };
  }

  // --------------------------------------------------------------------------
  // Event handlers - Canvas
  // --------------------------------------------------------------------------

  function onContextMenu(e) {
    e.evt.preventDefault();

    if (readOnly) return;

    const windowPos = stageRef.current.getPointerPosition();
    const stagePos = getStagePointerPosition();
    setLastPointerPosition({ window: windowPos, stage: stagePos });
    hideStageDialog();
    if (
      e.target === stageRef.current ||
      e.target.attrs.type === COMPONENT_TYPE.TRUST_BOUNDARY
    ) {
      setStageDialog({
        type: DIALOG.CONTEXT_MENU,
        variant: CONTEXT_MENU_VARIANT.ADD_COMPONENT,
      });
    } else if (e.target.attrs.name === COMPONENT_TYPE.DATA_FLOW) {
      setStageDialog({
        type: DIALOG.CONTEXT_MENU,
        variant: CONTEXT_MENU_VARIANT.TOGGLE_BIDIRECTIONAL,
        id: e.target.attrs.id,
      });
    }
  }

  function onStageDragEnd(e) {
    setStage({
      ...stage,
      x: e.currentTarget.attrs.x,
      y: e.currentTarget.attrs.y,
      action: STAGE_ACTION.DRAG,
    });
  }

  function onSelectionDragStart(e, draggedComponentId) {
    // console.log("onSelectionDragStart");
    if (!(draggedComponentId in selected)) {
      // Handles the case where no component is selected yet a component is still dragged, by setting it as the only selected component
      setMultipleSelected([draggedComponentId], true);
    }
    grabbingCursor();
  }

  function onSelectionDragMove(e, draggedComponentId) {
    const currPos = e.target.position();
    const diff = {
      x: currPos.x - componentsPos[draggedComponentId].x,
      y: currPos.y - componentsPos[draggedComponentId].y,
    };
    const selectedIds = Object.keys(selected);
    // console.log("onSelectionDragMove", selectedIds, componentsPos);

    const newComponentsPos = selectedIds
      .filter((id) => id in componentsPos)
      .reduce(
        (acc, id) => ({
          ...acc,
          [id]: {
            x: componentsPos[id].x + diff.x,
            y: componentsPos[id].y + diff.y,
          },
        }),
        {}
      );

    // console.log(
    //   "onSelectionDragMove",
    //   selectedIds,
    //   componentsPos,
    //   newComponentsPos
    // );

    setComponentsPos((prevComponentsPos) => ({
      ...prevComponentsPos,
      ...newComponentsPos,
    }));
  }

  function onSelectionDragEnd() {
    const selectedIds = Object.keys(selected);
    // console.log("onSelectionDragEnd", selectedIds, componentsPos);

    dispatch(
      moveComponents(
        selectedIds
          .filter((id) => id in componentsPos)
          .map((id) => ({
            x: componentsPos[id].x,
            y: componentsPos[id].y,
            id,
          }))
      )
    );
    pointerCursor();
  }

  // --------------------------------------------------------------------------
  // Functions
  // --------------------------------------------------------------------------

  function hideStageDialog() {
    setStageDialog({ type: DIALOG.NONE });
    setEditDataFlow(false);
    focusDiagramContainer();
  }

  function focusDiagramContainer() {
    if (diagramContainerRef.current) {
      diagramContainerRef.current.focus();
    }
  }

  const addComponent = useAddComponent();

  function copyComponents() {
    setClipboard(selected);
  }

  function getStagePointerPosition() {
    if (!stageRef.current) {
      return { x: null, y: null };
    }
    const pos = stageRef.current.getPointerPosition();
    return getAbsolutePosition(stageRef.current, pos);
  }

  function pasteComponents() {
    dispatch(copyNodes(Object.keys(clipboard)));
    setClipboard([]);
  }

  return (
    <div
      id="diagram-container"
      ref={diagramContainerRef}
      tabIndex={1}
      style={{
        cursor: stage.panning ? "grab" : "",
        flexGrow: 1,
        position: "relative",
      }}
      onKeyDown={(e) => onKeyDown(e)}
      onKeyUp={(e) => onKeyUp(e)}
    >
      <ControlsToolBar
        stage={stage}
        zoomInCenter={zoomInCenter}
        onAddComponent={(name, type) => {
          let pos = {
            x: stage.width / 2,
            y: stage.height / 2,
          };
          if (stageRef.current) {
            pos = getAbsolutePosition(stageRef.current, pos);
          }
          addComponent({ name, type, x: pos.x, y: pos.y });
        }}
      />
      {rightPanelCollapsed === true && <ToggleRightPanelButton />}
      {leftPanelCollapsed === true && <ToggleLeftPanelButton />}

      <ContextMenu
        stage={stage}
        stageRef={stageRef}
        stageDialog={stageDialog}
        open={stageDialog.type === DIALOG.CONTEXT_MENU}
        x={lastPointerPosition.window.x}
        y={lastPointerPosition.window.y}
        onClose={hideStageDialog}
      />

      {/* Canvas */}
      {stage.width ? (
        <ReactReduxContext.Consumer>
          {({ store }) => (
            <Stage
              ref={stageRef}
              x={stage.x}
              y={stage.y}
              width={stage.width}
              height={stage.height}
              draggable={stage.panning}
              onContextMenu={onContextMenu}
              onMouseDown={onStageMouseDown}
              onMouseMove={onStageMouseMove}
              onMouseUp={onStageMouseUp}
              onDragEnd={onStageDragEnd}
              onClick={onStageClick}
              onWheel={onStageWheel}
              scaleX={stage.scale}
              scaleY={stage.scale}
              isStage
            >
              <Provider store={store}>
                <Grid
                  x={stage.x}
                  y={stage.y}
                  width={stage.width}
                  height={stage.height}
                  scale={stage.scale}
                  action={stage.action}
                />

                {/* 
                <DebugLayer
                  lastPointerPosition={lastPointerPosition}
                  stage={stage}
                  stageRef={stageRef}
                /> */}

                <Layer key="layer-components">
                  {components &&
                    components
                      .slice()
                      .map((c) => ({ ...c, selected: c.id in selected }))
                      .sort(componentSort)
                      .map((c) => {
                        const ComponentType = componentTypes[c.type];
                        return (
                          <ComponentType
                            {...c}
                            x={componentsPos[c.id]?.x || c.x}
                            y={componentsPos[c.id]?.y || c.y}
                            key={c.id}
                            id={c.id}
                            onMagnetClick={onMagnetClick(c.id)}
                            onClick={onComponentClick(c.id)}
                            draggable={!stage.panning && !readOnly}
                            stageRef={stageRef}
                            stage={stage}
                            readOnly={readOnly}
                            editDataFlow={editDataFlow}
                            selected={c.selected}
                            onDragStart={(e) => onSelectionDragStart(e, c.id)}
                            onDragMove={(e) => onSelectionDragMove(e, c.id)}
                            onDragEnd={() => onSelectionDragEnd()}
                          />
                        );
                      })}

                  {dataFlows.map((df) => (
                    <DataFlow
                      key={df.id}
                      id={df.id}
                      bidirectional={df.bidirectional}
                      points={[
                        componentsPos[df.startComponent.id]?.x || df.points[0],
                        componentsPos[df.startComponent.id]?.y || df.points[1],
                        ...df.points.slice(2, -2),
                        componentsPos[df.endComponent.id]?.x ||
                          df.points.slice(-2)[0],
                        componentsPos[df.endComponent.id]?.y ||
                          df.points.slice(-2)[1],
                      ]}
                      label={df.label}
                      selected={df.id in selected}
                      onClick={onDataFlowClick(df.id)}
                      getStagePointerPosition={getStagePointerPosition}
                    />
                  ))}
                </Layer>

                <Layer key="new-data-flow" listening={false}>
                  {editDataFlow && (
                    <DataFlow
                      key={editDataFlow.id}
                      id={editDataFlow.id}
                      bidirectional={false}
                      points={[
                        componentsPos[editDataFlow.startComponent.id].x,
                        componentsPos[editDataFlow.startComponent.id].y,
                        ...editDataFlow.points.slice(2),
                      ]}
                      isEditing
                    />
                  )}
                </Layer>

                <SelectionRectangle {...selectionRectangle} />
              </Provider>
            </Stage>
          )}
        </ReactReduxContext.Consumer>
      ) : (
        <Loading />
      )}

      {!isFramed && <ActiveUsers />}
    </div>
  );
}
