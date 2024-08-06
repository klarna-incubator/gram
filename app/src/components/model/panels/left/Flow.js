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
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useGetFlowAttributesQuery } from "../../../../api/gram/attributes";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { EditableTypography } from "../../../elements/EditableTypography";

function DynamicSwitch({ value, onChange, label, ...props }) {
  return (
    <FormControlLabel
      labelPlacement="start"
      control={
        <Switch
          checked={value}
          onChange={(e) => onChange({ target: { value: e.target.checked } })}
          {...props}
        />
      }
      label={label}
    />
  );
}

function DynamicDropdown(options, allowMultiple, allowCustomValue) {
  return ({ value, onChange, label, ...props }) => {
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
          value={value}
          options={options}
          renderInput={(props) => <TextField {...props} label={label} />}
          onChange={(_, values) => onChange({ target: { value: values } })}
        />
      </FormControl>
    );
  };
}

function DynamicTextField(multiline) {
  return ({ value, onChange, label, ...props }) => {
    // const [val, setVal] = useState(value);
    return (
      <TextField
        {...props}
        multiline={multiline}
        defaultValue={value}
        // value={val}
        // onChange={(e) => setVal(e.target.value)}
        label={label}
        onKeyDown={shouldBlur}
        onBlur={(e) => onChange(e)}
      />
    );
  };
}

function DynamicAttribute(attribute) {
  console.log(attribute);
  switch (attribute.type) {
    case "text":
      return DynamicTextField(attribute.multiline);
    // case "boolean":
    //   return DynamicSwitch;
    case "select":
      return DynamicDropdown(
        attribute.options,
        attribute.allowMultiple,
        attribute.allowCustomValue
      );
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

export function Flow({ flow, setFlow, onDelete, defaultExpanded }) {
  const readOnly = useReadOnly();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data } = useGetFlowAttributesQuery();
  console.log(data);
  console.log(flow);

  const attributesInFlow = new Set(Object.keys(flow));
  const attributes =
    data?.map((att) => ({
      ...att,
      component: DynamicAttribute(att),
    })) || [];

  return (
    <Accordion expanded={expanded} square>
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
        <>
          <Box sx={{ flexGrow: 1, marginLeft: "10px", marginTop: "2px" }}>
            {/*  */}
            <EditableTypography
              text={flow.summary}
              placeholder="Summary"
              variant="body1"
              size="small"
              color="text.primary"
              onSubmit={(summary) => {
                setFlow({ ...flow, summary });
              }}
              onClick={(e) => e.stopPropagation()}
              readOnly={readOnly}
            />
          </Box>
          <Box>
            <Tooltip title="Remove flow">
              <IconButton onClick={onDelete} size="small">
                <ClearRoundedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      </AccordionSummary>
      <AccordionDetails>
        <Box gap="10px">
          {/* Additional attributes added on one by one <Select key> next to <Input value> */}
          {attributes
            .filter((att) => attributesInFlow.has(att.key))
            .map((att) => (
              <Box key={att.key} display="flex" sx={{ marginBottom: "20px" }}>
                <FormControl fullWidth>
                  <att.component
                    value={flow[att.key]}
                    onChange={(e) => {
                      setFlow({ ...flow, [att.key]: e.target.value });
                    }}
                    size="small"
                    label={att.label}
                    // onKeyDown={shouldBlur}
                    disabled={readOnly}
                  />
                </FormControl>
                <Tooltip title="Remove attribute">
                  <IconButton
                    onClick={() => {
                      const newFlow = { ...flow };
                      delete newFlow[att.key];
                      setFlow(newFlow);
                    }}
                    size="small"
                  >
                    <ClearRoundedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
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
                    Add Attribute
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
                      setFlow({ ...flow, [att.key]: att.defaultValue });
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
