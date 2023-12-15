import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  IconButton,
  Link,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch} from "react-redux";
import { modalActions } from "../../../redux/modalSlice";
import HightlightOverlay from "../../elements/overlay/HightlightOverlay";
import addcomponentImg from "./img/addcomponent.png";
import indicatorAlmostSecureImg from "./img/almost-secure.svg";
import componentctrlsImg from "./img/componentctrls.gif";
import componentTab from "./img/componenttab.png";
import creatingControls from "./img/creatingcontrols.gif";
import creatingThreats from "./img/creatingthreats.gif";
import dataflowImg from "./img/dataflow.gif";
import datastoreImg from "./img/datastore.png";
import externalEntityImg from "./img/externalentity.png";
import indicatorsImg from "./img/indicators.png";
import processImg from "./img/process.png";
import reviewRequestViewImg from "./img/reviewRequestView.png";
import rightPanelHeader from "./img/rightpanelheader.png";
import indicatorSecureImg from "./img/secure.svg";
import suggestions from "./img/suggestions.gif";
import indicatorUnknownImg from "./img/unknown.svg";
import indicatorVulnerableImg from "./img/vulnerable.svg";
import actionItemImg from "./img/actionItem.gif";
import { ContactChip } from "../../elements/ContactChip";

import {
  setMultipleSelected,
} from "../../../actions/model/setSelected";

const Introduction = () => (
  <>
    <Typography>
      Gram is a threat modeling tool, where you can create a data flow diagram enriched with threats and controls. 
    </Typography>
    <Typography>
      This tutorial will show you how to use it.
    </Typography>
    <Typography>
      If you have any questions or feedback, feel free to reach out to{" "}
      <ContactChip />
    </Typography>
  </>
);

const SystemContext = () => (
  <>
    <Typography>
      On the left panel in the system tab, there is information about your
      system taken from the system inventory as well as other sources. This
      helps contextualize the system that is being modeled.
    </Typography>
    <Typography>
      In addition to this, the left panel also contains information on any
      current{" "}
      <Typography sx={{ fontWeight: "bold", display: "inline" }}>
        review
      </Typography>{" "}
      ongoing for your threat model. This we'll talk about next!
    </Typography>
  </>
);

const General = () => (
  <>
    <Typography>
      Let's start threat modeling.
    </Typography>
    <Typography>
      First, a dataflow diagram is created, representing the components 
      of a system and how the data flows between
      them. It is, then, used to find potential threats and controls.
    </Typography>
    <Typography>
      The diagram is built from three different types of components. Let's
      go through each and explain what they are!
    </Typography>
  </>
);

const ProcessExplanation = () => (
  <>
    <Typography>
      Processes are represented by an oval. They are processes or operating units within the system in scope, e.g. the API that runs your business logic or the frontend
      application that is visible to users.
    </Typography>
    <Typography>
      Some concrete examples of processes are: a NodeJS webservice running via
      docker, a lambda function, or a React app.
    </Typography>
  </>
);

const DataStoreExplanation = () => (
  <>
    <Typography>
      Data stores indicate where the "bulk" data is stored. These components are
      represented by two parallel horizontal lines.
    </Typography>
    <Typography>
      Some concrete examples of data stores are: a Postgres database, a redis
      cache, or an S3 bucket.
    </Typography>
  </>
);

const ExternalEntityExplanation = () => (
  <>
    <Typography>
      External Entities are represented by a rectangle. They are processes or operating units interacting with the system in scope. As such,
      threats are not tracked for these components.
    </Typography>
    <Typography>
      Some concrete examples of processes could be: an API that your service
      interacts with owned by a different team, or a third party provider such
      as Google.
    </Typography>
  </>
);

const CreateComponent = () => (
  <>
    <Typography>
      To add a new component to the diagram, simply right click anywhere on the
      board to access the context menu, then select the type of component you
      would like to add.
    </Typography>
    <Typography sx={{ fontWeight: "bold" }}>
      Add a Process or Data store. Select it and then press next to continue.
    </Typography>
  </>
);

const ComponentTab = () => (
  <>
    <Typography>
      The component tab contain input fields for specifying component specific
      information not relating to threats or controls.
    </Typography>
    <Typography>
      The type dropdown lets you edit the component type, e.g. a process is
      later discovered to be out of scope for the threat model, then switch the
      type to external entity.
    </Typography>
    <Typography>
      The tech stack dropdown is used to specify the technologies that the
      component uses (e.g. Node.js, React, Kafka, AWS S3, or AWS RDS).
    </Typography>
    <Typography>
      The description field should be used to present additional information
      about what the component is used for etc.
    </Typography>
  </>
);

const MoreComponentStuff = () => (
  <>
    <Typography>
      You can move the component freely through drag and drop. Multiple
      components can be selected and moved at the same time. Delete and
      copy/paste are supported too.
    </Typography>
    <Typography>
      If you need to move your view of the diagram, hold spacebar and drag with
      your mouse cursor. Similarily, zooming is supported via holding the Ctrl
      key and scrolling.
    </Typography>
  </>
);

const DataFlows = () => (
  <>
    <Typography>
      You can connect components by using dataflows. In a threat modelling
      sense, this will signify that data is transferred (flowing) between the
      two connected components.
    </Typography>
    <Typography>
      Hover your mouse over the component
      where you want the flow to start, then click one of the small grey circles
      that appear around it. You can change the flow direction or make the flow bidirectional by right-click on
      the dataflow.
    </Typography>
    <Typography>
      What is the right direction for the arrow?
      The direction of the arrow represents the flow of meaningful data.
      Meaningful data is any data that is of value for the system in scope.
    </Typography>
    <Typography>
      An example of a unidirectional flow could be a system fetching data from an external API. 
      The arrow would start at the external API and point out process representing the system in scope.
    </Typography>
    <Typography>
      An example of a bidirectional flow could be a database connection where a
      process is both storing and fetching data.
    </Typography>
  </>
);

const ComponentSelection = () => (
  <>
    <Typography>
      The right panel shows information about the threats and controls for the
      currently selected
    </Typography>
    <Typography sx={{ fontWeight: "bold" }}>
      Select a component on the board, and then press next to continue.
    </Typography>
  </>
);

const RightPanelTabs = () => (
  <>
    <Typography>
      At the top of the right panel, you'll see the three tabs used to navigate
      between suggestions, threats and controls.
    </Typography>
    <Typography>
      The numbers beside the tab titles shows the number of items present in the
      tab and the color indicates the status of the items on that page. The
      image shows the tabs of a component which has three suggestions, one threat (which is
      still unmitigated) and one control (which is still
      pending).
    </Typography>
  </>
);

const CreatingThreats = () => (
  <>
    <Typography>
      The threats tab is used to add new threats to the selected component. Use
      the input field to add your own threat or one of the pre-configured STRIDE
      threats. Each threat has an optional description field that should be used
      to explain the threat in further detail.
    </Typography>
    <Typography>
      By using the "Add Control" input field inside each threat you can create
      bindings between existing controls or create new one, similar to how you
      add your own threat.
    </Typography>
    <Typography>
      Once added, the controls can be toggled between in-place and pending
      depending on if they are currently implemented or not. By clicking on the
      control chip you are redirected to the corresponding control in the
      controls tab.
    </Typography>
  </>
);

const FindingThreats = () => (
  <>
    <Typography>
      The hard part of creating your threat model might be identifying threats.
      For this we can recommend the helpful STRIDE mnemonic, which can be used
      to enumerate over common categories of threats:
    </Typography>

    <ul>
      <li>
        <Typography>
          <Typography display={"inline"} sx={{ fontWeight: "bold" }}>
            Spoofing
          </Typography>
          . Pretending to be something or someone you're not.
        </Typography>
      </li>
      <li>
        <Typography display={"inline"} sx={{ fontWeight: "bold" }}>
          Tampering
        </Typography>
        . Modifying something you're not supposed to modify. This can be on
        disk, in memory, and/or in transit (“on the wire”).
      </li>
      <li>
        <Typography display={"inline"} sx={{ fontWeight: "bold" }}>
          Repudiation
        </Typography>
        . Claiming you didn't do something, whether or not you actually did.
      </li>
      <li>
        <Typography display={"inline"} sx={{ fontWeight: "bold" }}>
          Information Disclosure
        </Typography>
        . Exposing information to people who aren't authorised to see it.
      </li>
      <li>
        <Typography display={"inline"} sx={{ fontWeight: "bold" }}>
          Denial of service
        </Typography>
        . Taking actions to prevent the system from providing service to
        legitimate users.
      </li>
      <li>
        <Typography display={"inline"} sx={{ fontWeight: "bold" }}>
          Escalation of privilege
        </Typography>
        . Being able to perform operations you aren't supposed to be able to do.
      </li>
    </ul>

    <Typography>
      OWASP has a good reference sheet to STRIDE with some more detailed
      explanations and examples here:{" "}
      <Link
        target="_none"
        href="https://owasp.org/www-pdf-archive/STRIDE_Reference_Sheets.pdf"
      >
        https://owasp.org/www-pdf-archive/STRIDE_Reference_Sheets.pdf
      </Link>
    </Typography>
  </>
);

const ActionItems = () => (
  <>
    <Typography>
      To keep track of which threats should be addressed, you can mark them as
      an <b>action item</b>.
    </Typography>
    <Typography>
      When marking a threat as an action item, you also need to mark the
      severity of the threat. This helps prioritize and set the urgency of when
      this threat should be mitigated.
    </Typography>
  </>
);

const CreatingControls = () => (
  <>
    <Typography>
      The controls tab is used to add new controls to the selected component.
      Each control has an optional description field that should be used to
      explain the implementation details or other information.
    </Typography>
    <Typography>
      The toggle switch is used to indicate whether a control is in-place
      (already implemented) or pending (to be implemented). By using the "Add
      Threat" input field inside each threat you can create bindings between
      existing threats or create new one.
    </Typography>
    <Typography>
      The same threat/control can be bound to multiple controls/threats, e.g. a
      TLS control would be mitigating the threats of Tampering and Spoofing.
    </Typography>
  </>
);

const Suggestions = () => (
  <>
    <Typography>
      The suggestions tab contains suggestions for component specific threats
      and controls based on a number of different information sources (e.g. tech
      stack). If a suggestion is relevant you can choose to accept it and it
      will move to either the threats or controls tab depending on the variant.
    </Typography>
    <Typography>
      Suggested controls which are already implemented should be accepted since
      we want to document all controls which are included in the component.
    </Typography>
  </>
);

const ThreatIndicators = () => (
  <>
    <Typography>
      In the diagram, you may notice small indicator icons above each component.
      This helps to give an overview of the state of the system, as well as show
      you where you can improve the threat model itself. These colors correspond
      to the colors shown in the right panel tabs header.
    </Typography>
    <ul>
      <li>
        <img
          src={indicatorUnknownImg}
          alt="unknown indicator"
          height={16}
          width={16}
        />
        {"  "}
        indicates that there are no documented threats on this component.
      </li>
      <li>
        <img
          src={indicatorVulnerableImg}
          alt="vulnerable indicator"
          height={16}
          width={16}
        />
        {"  "}
        indicates that there are threats on this component that have no
        mitigating controls, in place or not.
      </li>
      <li>
        <img
          src={indicatorAlmostSecureImg}
          alt="almost secure indicator"
          height={16}
          width={16}
        />
        {"  "}
        indicates that there are threats on this component with mitigating
        controls, but they are not in place (yet).
      </li>
      <li>
        <img
          src={indicatorSecureImg}
          alt="secure indicator"
          height={16}
          width={16}
        />
        {"  "}
        indicates that there are threats on this component with mitigating
        controls and that they are all in place. Good job!
      </li>
    </ul>
  </>
);

const ReviewProcess = () => (
  <>
    <Typography>
      Once you finish creating your diagram and have documented some threats and
      controls, you will need to request a{" "}
      <Typography sx={{ fontWeight: "bold", display: "inline" }}>
        Threat Model Review
      </Typography>{" "}
      through the widget on the left panel.
    </Typography>
  </>
);

const ReviewExplained = () => (
  <>
    <Typography>
      When you request a review of your Model you need to select a reviewer.
    </Typography>
    <Typography>
      An email will be sent to the{" "}
      <Typography sx={{ fontWeight: "bold", display: "inline" }}>
        Reviewer
      </Typography>{" "}
      which will start reviewing your model. Once the review is finished, you
      will receive an email notification with notes and a threat model status:
    </Typography>
    <ul>
      <li>
        <Typography sx={{ fontWeight: "bold", display: "inline" }}>
          Meeting Requested
        </Typography>
        : Reviewer is requesting that you schedule a meeting to have Threat
        Modelling session. During this session, you will together go through the
        system and further complement the model.
      </li>
      <li>
        <Typography sx={{ fontWeight: "bold", display: "inline" }}>
          Approved
        </Typography>
        : Model is approved and there's no more action needed.
      </li>
    </ul>
  </>
);

const FinalWindow = () => (
  <>
    <Typography>
      This concludes the basic tutorial. We hope it was useful!
    </Typography>
    <Typography>
      If you have questions, feel free to reach out to <ContactChip />
    </Typography>
  </>
);

const steps = [
  {
    title: "Tutorial",
    body: Introduction,
    highlighted: [],
    position: "center",
  },
  {
    title: "System context",
    body: SystemContext,
    highlighted: ["#panel-left"],
    position: "center",
    actions: [setMultipleSelected]
  },
  {
    title: "Dataflow diagram",
    body: General,
    highlighted: [],
    position: "center",
  },
  {
    title: "Process",
    body: ProcessExplanation,
    media: {
      image: processImg,
      alt: "what the process component looks like in the diagram",
    },
    highlighted: [],
    position: "center",
  },
  {
    title: "Data store",
    body: DataStoreExplanation,
    media: {
      image: datastoreImg,
      alt: "what the datastore component looks like in the diagram",
    },
    highlighted: [],
    position: "center",
  },
  {
    title: "External entity",
    body: ExternalEntityExplanation,
    media: {
      image: externalEntityImg,
      alt: "what the external entity component looks like in the diagram",
    },
    highlighted: [],
    position: "center",
  },
  {
    title: "Add component",
    body: CreateComponent,
    media: {
      image: addcomponentImg,
      alt: "context menu shown when right clicking",
    },
    highlighted: ["#diagram-container"],
    position: "flex-start",
  },
  {
    title: "Component",
    body: ComponentTab,
    media: {
      image: componentTab,
      alt: "the component tab",
    },
    highlighted: ["#panel-left"],
    position: "center",
  },
  {
    title: "Component actions",
    body: MoreComponentStuff,
    media: {
      image: componentctrlsImg,
      alt: "animation of how you can manipulate components",
    },
    highlighted: ["#diagram-container"],
    position: "flex-start",
  },
  {
    title: "Dataflow",
    body: DataFlows,
    media: {
      image: dataflowImg,
      alt: "gif showing how to connect components",
    },
    highlighted: ["#diagram-container"],
    position: "flex-start",
  },
  {
    title: "Component selection",
    body: ComponentSelection,
    highlighted: ["#diagram-container"],
    position: "flex-start",
  },
  {
    title: "Right panel tabs",
    body: RightPanelTabs,
    media: {
      image: rightPanelHeader,
      alt: "right panel tabs",
    },
    highlighted: ["#panel-right-header"],
    position: "center",
  },
  {
    title: "Suggestions",
    body: Suggestions,
    media: {
      image: suggestions,
      alt: "the process of accepting suggestions",
    },
    highlighted: ["#panel-right"],
    position: "center",
  },
  {
    title: "Creating threats",
    body: CreatingThreats,
    media: {
      image: creatingThreats,
      alt: "the process of creating new threats",
    },
    highlighted: ["#panel-right"],
    position: "center",
  },
  {
    title: "STRIDE framework",
    body: FindingThreats,
    highlighted: ["#panel-right"],
    position: "center",
  },
  {
    title: "Creating controls",
    body: CreatingControls,
    media: {
      image: creatingControls,
      alt: "the process of creating new controls",
    },
    highlighted: ["#panel-right"],
    position: "center",
  },
  {
    title: "Action items",
    body: ActionItems,
    media: {
      image: actionItemImg,
      alt: "",
    },
    highlighted: ["#panel-right"],
    position: "center",
  },
  {
    title: "Component indicators",
    body: ThreatIndicators,
    media: {
      image: indicatorsImg,
      alt: "example of threat indicators",
    },
    highlighted: ["#diagram-container"],
    position: "flex-start",
  },
  {
    title: "Review",
    body: ReviewProcess,
    highlighted: ["#panel-left-review"],
    position: "center",
    actions: [setMultipleSelected]
  },
  {
    title: "Review flow",
    body: ReviewExplained,
    media: {
      image: reviewRequestViewImg,
      alt: "what the review request view looks like",
    },
    highlighted: ["#panel-left-review"],
    position: "center",
    actions: [setMultipleSelected]
  },
  {
    title: "Tutorial complete",
    body: FinalWindow,
    highlighted: [],
    position: "center",
  },
];

function Tutorial() {
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);

  const currentStep = steps[step];
  const Body = currentStep.body;
  const title = currentStep.title;

  function close() {
    dispatch(modalActions.close());
  }
  useEffect(()=> {
    if(currentStep.actions && currentStep.actions.length > 0){
      for (const action of currentStep.actions){
        dispatch(action());
      }
    }
  }, [step])

  return (
    <>
      <HightlightOverlay display={true} highlighted={currentStep.highlighted} />
      <Box
        sx={{
          pointerEvents: "none",
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          zIndex: 1500,
          display: "flex",
          alignItems: currentStep.position,
          justifyContent: currentStep.position,
        }}
      >
        <Card
          elevation={6}
          sx={{
            pointerEvents: "all",
            margin: "50px 100px",
            width: "500px",
            height: "fit-content",
          }}
        >
          <CardHeader
            action={
              <IconButton>
                <CloseRoundedIcon onClick={() => close()} />
              </IconButton>
            }
            title={title}
          />
          {currentStep.media && (
            <CardMedia
              component="img"
              image={currentStep.media?.image}
              alt={currentStep.media?.alt}
              height={currentStep.media?.height}
            />
          )}
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <Body />
          </CardContent>

          <CardActions disableSpacing sx={{ display: "flex" }}>
            {step > 0 && (
              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}

            <Button
              variant="contained"
              endIcon={step < steps.length - 1 && <ArrowForwardRoundedIcon />}
              onClick={() => {
                step === steps.length - 1 ? close() : setStep(step + 1);
              }}
              sx={{ marginLeft: "auto" }}
            >
              {step === steps.length - 1 ? "Close" : "Next"}
            </Button>
          </CardActions>
        </Card>
      </Box>
    </>
  );
}

export { Tutorial };
