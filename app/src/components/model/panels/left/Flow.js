import { ClearRounded as ClearRoundedIcon } from "@mui/icons-material";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useGetFlowAttributesQuery } from "../../../../api/gram/attributes";
import {
  useDeleteFlowMutation,
  usePatchFlowMutation,
} from "../../../../api/gram/flows";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { EditableTypography } from "../../../elements/EditableTypography";
import { EditableDescription } from "../EditableDescription";

function DynamicDropdown({ value, onChange, label, attribute, ...props }) {
  const { options, allowMultiple, allowCustomValue } = attribute;
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <FormControl fullWidth>
      <Autocomplete
        {...props}
        autoHighlight
        fullWidth
        multiple={allowMultiple}
        disableClearable
        filterSelectedOptions
        freeSolo={allowCustomValue}
        forcePopupIcon
        PaperComponent={(props) => (
          <Paper
            {...props}
            sx={{ colorScheme: (theme) => theme.palette.mode }}
          />
        )}
        value={val}
        options={options}
        renderInput={(props) => <TextField {...props} label={label} />}
        onChange={(_, values) => {
          onChange({ target: { value: values } });
          setVal(values);
        }}
      />
    </FormControl>
  );
}

function DynamicTextField({ value, onChange, label, attribute, ...props }) {
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <TextField
      {...props}
      multiline={attribute.multiline}
      value={val}
      label={label}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={shouldBlur}
      onBlur={(e) => {
        onChange(e);
      }}
    />
  );
}

function DynamicDescription({ value, onChange, label, attribute, ...props }) {
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <EditableDescription
      {...props}
      multiline={attribute.multiline}
      variant="outlined"
      description={val}
      label={label}
      updateDescription={(e) => setVal(e)}
      onKeyDown={shouldBlur}
      onBlur={(e) => {
        onChange(e);
      }}
      showPreviewTitle
    />
  );
}

function DynamicAttribute(attribute) {
  switch (attribute.type) {
    case "text":
      return DynamicTextField;
    case "select":
      return DynamicDropdown;
    case "description":
      return DynamicDescription;
    default:
      return TextField;
  }
}

function shouldBlur(e) {
  if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
    e.preventDefault();
    e.target.blur();
  }
}

export function Flow({ flow, defaultExpanded }) {
  const readOnly = useReadOnly();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data } = useGetFlowAttributesQuery();
  const [patchFlow] = usePatchFlowMutation();
  const [deleteFlow] = useDeleteFlowMutation();

  const attributesInFlow = new Set(Object.keys(flow.attributes));
  const attributes =
    data?.map((att) => ({
      ...att,
      component: DynamicAttribute(att),
    })) || [];

  return (
    <Accordion
      expanded={expanded}      
      square
      disableGutters
    >
      <AccordionSummary
        sx={{
          flexDirection: "row-reverse",
          "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
            transform: "rotate(90deg)",
          },
        }}
        expandIcon={
          <IconButton
            onClick={() => {
              setExpanded(!expanded);
            }}
          >
            <ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />
          </IconButton>
        }
      >
        <Box sx={{ flexGrow: 1, marginLeft: "10px", marginTop: "2px" }}>
          <EditableTypography
            text={flow.summary}
            placeholder="Summary"
            variant="body1"
            size="small"
            color="text.primary"
            onSubmit={(summary) => {
              patchFlow({
                flowId: flow.id,
                ...flow,
                summary,
              });
            }}
            onClick={(e) => e.stopPropagation()}
            readOnly={readOnly}
          />
        </Box>
        <Box>
          <Tooltip title="Remove flow">
            <IconButton
              onClick={() => deleteFlow({ flowId: flow.id })}
              size="small"
            >
              <ClearRoundedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ margin: 0 }}>
        <Box>
          {/* Additional attributes added on one by one <Select key> next to <Input value> */}
          {attributes
            .filter((att) => attributesInFlow.has(att.key))
            .map((att) => (
              <Box key={att.key} display="flex" sx={{ marginBottom: "20px" }}>
                <FormControl fullWidth>
                  <att.component
                    attribute={att}
                    value={flow.attributes[att.key]}
                    onChange={(e) => {
                      patchFlow({
                        flowId: flow.id,
                        ...flow,
                        attributes: {
                          ...flow.attributes,
                          [att.key]: e.target.value,
                        },
                      });
                    }}
                    size="small"
                    label={att.label}
                    disabled={readOnly}
                  />
                </FormControl>
                {att.optional && (
                  <Tooltip title="Remove attribute">
                    <IconButton
                      onClick={() => {
                        const newAttributes = { ...flow.attributes };
                        delete newAttributes[att.key];
                        patchFlow({
                          flowId: flow.id,
                          ...flow,
                          attributes: newAttributes,
                        });
                      }}
                      size="small"
                    >
                      <ClearRoundedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ))}

          {/* Adding/selecting new attribute to set */}
          {attributes.filter((att) => !attributesInFlow.has(att.key)).length >
            0 &&
            !readOnly && (
              <>
                <Divider sx={{ marginBottom: "20px" }} />
                <FormControl fullWidth>
                  <InputLabel size="small" sx={{ margin: 0 }}>
                    Add more attributes
                  </InputLabel>
                  <Select
                    fullWidth
                    size="small"
                    value=""
                    onChange={(
                      e //
                    ) => {
                      const att = attributes.find(
                        (att) => att.key === e.target.value
                      );
                      patchFlow({
                        flowId: flow.id,
                        ...flow,
                        attributes: {
                          ...flow.attributes,
                          [att.key]: att.defaultValue,
                        },
                      });
                      e.target.value = "";
                    }}
                  >
                    {attributes
                      .filter((att) => !attributesInFlow.has(att.key))
                      .map((att) => (
                        <MenuItem key={att.key} value={att.key}>
                          {att.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </>
            )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
