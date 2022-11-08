import Konva from "konva";
import React, { useEffect, useRef, useState } from "react";
import { Group, Layer, Stage } from "react-konva";
import {
  Provider,
  ReactReduxContext,
  useDispatch,
  useSelector,
} from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addComponent } from "../../../actions/model/addComponent";
import { addDataFlow } from "../../../actions/model/addDataFlow";
import { CURSOR_PAN } from "../../../actions/model/controlsToolbarActions";
import { copyNodes } from "../../../actions/model/copyNodes";
import { deleteSelected } from "../../../actions/model/deleteSelected";
import { moveComponents } from "../../../actions/model/moveSelected";
import { patchComponent } from "../../../actions/model/patchComponent";
import { patchDataFlow } from "../../../actions/model/patchDataFlow";
import {
  setMultipleSelected,
  setSelected,
} from "../../../actions/model/setSelected";
import { useListControlsQuery } from "../../../api/gram/controls";
import { useListMitigationsQuery } from "../../../api/gram/mitigations";
import { useGetModelPermissionsQuery } from "../../../api/gram/model";
import { useListThreatsQuery } from "../../../api/gram/threats";
import { modalActions } from "../../../redux/modalSlice";
import { MODALS } from "../../elements/modal/ModalManager";
import Loading from "../../loading";
import { PERMISSIONS } from "../constants";
import { useModelID } from "../hooks/useModelID";
import ActiveUsers from "../panels/ActiveUsers";
import { ControlsToolBar } from "./components/ControlsToolBar";
import { Grid } from "./components/Grid";
import { ContextMenu } from "./components/menu/ContextMenu";
import { SelectionRectangle } from "./components/SelectionRectangle";
import { ToggleLeftPanelButton } from "./components/ToggleLeftPanelButton";
import { ToggleRightPanelButton } from "./components/ToggleRightPanelButton";
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
import { getAbsolutePosition } from "./util";

export default function Board() {
  const dispatch = useDispatch();
  const diagramContainerRef = useRef();
  const stageRef = useRef();

  const modelId = useModelID();

  const { data: modelThreats } = useListThreatsQuery({ modelId });
  const threats = modelThreats?.threats || {};

  const { data: modelControls } = useListControlsQuery({ modelId });
  const controls = modelControls?.controls || {};

  const { data: modelMitigations } = useListMitigationsQuery({ modelId });
  const mitigations = modelMitigations?.mitigations || [];

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

  const { data: permissions } = useGetModelPermissionsQuery({ modelId });
  const readOnly = !permissions?.includes(PERMISSIONS.WRITE);

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

  // Check read only mode
  const [changingComponentName, setChangingComponentName] = useState(false);

  const componentsPosObj = components.reduce(
    (acc, c) => ({ ...acc, [c.id]: { x: c.x, y: c.y } }),
    {}
  );
  const [componentsPos, setComponentsPos] = useState(componentsPosObj);
  const [selectedComponentsStartPos, setSelectedComponentsStartPos] = useState(
    {}
  );
  const jsonComponentsPosObj = JSON.stringify(componentsPosObj);
  useEffect(() => {
    setComponentsPos(componentsPosObj);
    // eslint-disable-next-line
  }, [components, jsonComponentsPosObj]);

  // Local variables
  const componentTypes = {
    ee: ExternalEntity,
    proc: Process,
    ds: DataStore,
  };

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
      panning: cursorType === CURSOR_PAN ? true : false,
    }));
  }, [cursorType]);

  // --------------------------------------------------------------------------
  // Event handlers - Input Events
  // --------------------------------------------------------------------------
  function onKeyDown(e) {
    if (e.repeat || (changingComponentName && e.key !== "Delete")) {
      return;
    }
    if (e.key === "Escape") {
      hideStageDialog();
    }

    if (stageDialog.type !== DIALOG.NONE) {
      return;
    }

    if (e.key === " " && !stage.panning) {
      setStage((prevStage) => ({
        ...prevStage,
        panning: true,
      }));
    }

    if (!readOnly) {
      // Delete
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        Object.keys(selected).length !== 0
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
  function onMouseDown(e) {
    if (e.target.attrs.isStage) {
      if (stageDialog.type === DIALOG.CONTEXT_MENU) {
        hideStageDialog();
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

  function onMouseMove() {
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

  function onMouseUp(e) {
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
      dispatch(setMultipleSelected(Object.keys(selectedComponents)));
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
          ? stage.scale * (ZOOM.SCALE_BY * 1.2)
          : stage.scale / (ZOOM.SCALE_BY * 1.2)
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

  function onComponentClick(id) {
    return function (e, closestMagnet) {
      // If not left click
      if (e.evt.button !== 0) {
        return;
      }

      if (editDataFlow && closestMagnet && !readOnly) {
        onMagnetClick(id)(closestMagnet);
        return;
      }

      if (e.evt.shiftKey) {
        dispatch(setSelected(id, true));
      } else if (e.evt.ctrlKey || e.evt.metaKey) {
        dispatch(setSelected(id, false));
      } else {
        dispatch(setMultipleSelected([id]));
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
    if (e.target === stageRef.current) {
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
    } else if (
      e.target.attrs.name === COMPONENT_TYPE.DATA_STORE ||
      e.target.attrs.name === COMPONENT_TYPE.EXTERNAL_ENTITY ||
      e.target.attrs.name === COMPONENT_TYPE.PROCESS
    ) {
      setStageDialog({
        type: DIALOG.CONTEXT_MENU,
        variant: CONTEXT_MENU_VARIANT.EDIT_COMPONENT,
        id: e.target.attrs.id,
      });
    }
  }

  function onDragEnd(e) {
    const newStagePos = e.currentTarget.position();
    setStage({
      ...stage,
      x: newStagePos.x,
      y: newStagePos.y,
      action: STAGE_ACTION.DRAG,
    });
  }

  function grabbingCursor() {
    document.body.style.cursor = "grabbing";
  }

  function pointerCursor() {
    document.body.style.cursor = "pointer";
  }

  function onSelectionDragEnd(e) {
    e.target.setPosition(0, 0); // move group back to origin but change coords of all moved components
    dispatch(
      moveComponents(
        Object.keys(selected).map((id) => ({ ...componentsPos[id], id: id }))
      )
    );
    pointerCursor();
  }

  function onComponentDragStart() {
    return function (e) {
      e.target.moveToTop();
      grabbingCursor();
    };
  }

  function onComponentDragEnd(id) {
    return function (e) {
      dispatch(patchComponent(id, componentsPos[id]));
      pointerCursor();
    };
  }

  function onComponentDragMove(id) {
    return function (position) {
      setComponentsPos({
        ...componentsPos,
        [id]: { ...position },
      });
    };
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

  function onAddComponent(name, type) {
    const id = uuidv4();

    dispatch(
      addComponent(
        {
          name,
          type,
          x: lastPointerPosition.stage.x - COMPONENT_SIZE.WIDTH / 2,
          y: lastPointerPosition.stage.y - COMPONENT_SIZE.HEIGHT / 2,
        },
        id
      )
    );

    dispatch(setMultipleSelected([id]));
    setChangingComponentName(id);

    hideStageDialog();
  }

  function onToggleBidirectional(id) {
    dispatch(
      patchDataFlow(id, {
        bidirectional: !dataFlows.find((df) => df.id === id).bidirectional,
      })
    );
    hideStageDialog();
  }

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

  function changeComponentName(id) {
    return function (newName) {
      dispatch(patchComponent(id, { name: newName }));
    };
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
      <ControlsToolBar zoomInCenter={zoomInCenter} />
      {rightPanelCollapsed === true && <ToggleRightPanelButton />}
      {leftPanelCollapsed === true && <ToggleLeftPanelButton />}
      <ContextMenu
        stage={stage}
        stageDialog={stageDialog}
        open={stageDialog.type === DIALOG.CONTEXT_MENU}
        x={lastPointerPosition.window.x}
        y={lastPointerPosition.window.y}
        onToggleBidirectional={onToggleBidirectional}
        onAddComponent={onAddComponent}
      />

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
              onContextMenu={(e) => onContextMenu(e)}
              onMouseDown={(e) => onMouseDown(e)}
              onMouseMove={() => onMouseMove()}
              onMouseUp={(e) => onMouseUp(e)}
              onDragEnd={(e) => onDragEnd(e)}
              onClick={(e) => onStageClick(e)}
              onWheel={(e) => onStageWheel(e)}
              scaleX={stage.scale}
              scaleY={stage.scale}
              isStage
            >
              <Provider store={store}>
                <Grid {...stage} />

                <Layer key="layer-components">
                  {components
                    .filter((c) => !(c.id in selected))
                    .map((c) => {
                      const ComponentType = componentTypes[c.type];
                      return (
                        <ComponentType
                          {...c}
                          key={c.id}
                          id={c.id}
                          onDragMove={onComponentDragMove(c.id)}
                          onMagnetClick={onMagnetClick(c.id)}
                          onClickP={onComponentClick(c.id)}
                          threats={threats ? threats[c.id] : []}
                          controls={controls ? controls[c.id] : []}
                          mitigations={mitigations}
                          draggable={!stage.panning && !readOnly}
                          stageRef={stageRef}
                          stage={stage}
                          readOnly={readOnly}
                          changingComponentName={changingComponentName}
                          setChangingComponentName={setChangingComponentName}
                          changeComponentName={changeComponentName(c.id)}
                          focusDiagramContainer={() => focusDiagramContainer()}
                          onDragStart={onComponentDragStart()}
                          onDragEnd={onComponentDragEnd(c.id)}
                          editDataFlow={editDataFlow}
                        />
                      );
                    })}
                  {dataFlows.map((df) => (
                    <DataFlow
                      key={df.id}
                      id={df.id}
                      bidirectional={df.bidirectional}
                      points={[
                        componentsPos[df.startComponent.id]
                          ? componentsPos[df.startComponent.id].x
                          : df.points[0],
                        componentsPos[df.startComponent.id]
                          ? componentsPos[df.startComponent.id].y
                          : df.points[1],
                        ...df.points.slice(2, -2),
                        componentsPos[df.endComponent.id]
                          ? componentsPos[df.endComponent.id].x
                          : df.points[df.points.length - 2],
                        componentsPos[df.endComponent.id]
                          ? componentsPos[df.endComponent.id].y
                          : df.points[df.points.length - 1],
                      ]}
                      selected={df.id in selected}
                      onClick={onComponentClick(df.id)}
                      getStagePointerPosition={() => getStagePointerPosition()}
                    />
                  ))}
                </Layer>

                <Layer key="selected-layer-components">
                  <Group
                    draggable={!stage.panning && !readOnly}
                    onDragStart={(e) => {
                      grabbingCursor();
                      setSelectedComponentsStartPos(
                        e.target.children.map((child) => ({
                          id: child.attrs.id,
                          x: child.attrs.x,
                          y: child.attrs.y,
                        }))
                      );
                    }}
                    onDragMove={(e) => {
                      const newGroupPos = e.target.position();
                      const newComponentsPos = selectedComponentsStartPos
                        .map((c) => ({
                          ...c,
                          x: c.x + newGroupPos.x,
                          y: c.y + newGroupPos.y,
                        }))
                        .reduce(
                          (a, v) => ({ ...a, [v.id]: { x: v.x, y: v.y } }),
                          {}
                        );
                      setComponentsPos((prevComponentsPos) => ({
                        ...prevComponentsPos,
                        ...newComponentsPos,
                      }));
                    }}
                    onDragEnd={(e) => onSelectionDragEnd(e)}
                  >
                    {components
                      .filter((c) => c.id in selected)
                      .map((c) => {
                        const ComponentType = componentTypes[c.type];
                        return (
                          <ComponentType
                            {...c}
                            key={c.id}
                            id={c.id}
                            onDragMove={onComponentDragMove(c.id)}
                            onMagnetClick={onMagnetClick(c.id)}
                            onClickP={onComponentClick(c.id)}
                            threats={threats ? threats[c.id] : []}
                            controls={controls ? controls[c.id] : []}
                            mitigations={mitigations}
                            draggable={false}
                            stageRef={stageRef}
                            stage={stage}
                            readOnly={readOnly}
                            changingComponentName={changingComponentName}
                            setChangingComponentName={setChangingComponentName}
                            changeComponentName={changeComponentName(c.id)}
                            focusDiagramContainer={() =>
                              focusDiagramContainer()
                            }
                            editDataFlow={editDataFlow}
                            selected
                          />
                        );
                      })}
                  </Group>
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
                      isEditing={true}
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
      <ActiveUsers />
    </div>
  );
}
