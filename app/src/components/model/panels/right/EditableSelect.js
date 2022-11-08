import { FiberManualRecord as FiberManualRecordIcon } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  createFilterOptions,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

const filter = createFilterOptions();

function CustomPaper(props) {
  return (
    <Paper {...props} sx={{ colorScheme: (theme) => theme.palette.mode }} />
  );
}

export function EditableSelect(props) {
  const { placeholder, options, selectExisting, createNew } = props;
  const [isEditing, setIsEditing] = useState(false);
  const isControls = options.some((e) => e.hasOwnProperty("inPlace"));
  return (
    <>
      {isEditing ? (
        <Autocomplete
          autoHighlight
          disableClearable
          openOnFocus
          clearOnBlur
          blurOnSelect
          forcePopupIcon
          freeSolo
          PaperComponent={CustomPaper}
          sx={{
            "& div div fieldset": {
              borderColor: (theme) =>
                theme.palette.common.gramPink + "!important",
            },
          }}
          options={options}
          onChange={(e, v) => {
            if (typeof v === "string" || (v && v.inputValue)) {
              createNew(v.inputValue || v);
            } else {
              selectExisting(v);
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            const { inputValue } = params;

            const isExisting = options.some(
              (option) => inputValue === option.title
            );

            if (inputValue !== "" && !isExisting) {
              filtered.push({
                inputValue,
                title: `Create "${inputValue}"`,
              });
            }

            return filtered;
          }}
          getOptionLabel={(option) => {
            if (typeof option === "string") {
              return option;
            }
            if (option.inputValue) {
              return option.inputValue;
            }
            return option.title;
          }}
          renderOption={(props, option) => (
            <Box
              component="li"
              {...props}
              key={option.id || option.title || option}
              sx={{ margin: 0, gap: "5px" }}
            >
              {isControls && (
                <FiberManualRecordIcon
                  color={option.inPlace ? "success" : "warning"}
                  fontSize="small"
                />
              )}
              {option.title}
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus={true}
              size="small"
              onBlur={() => setIsEditing(false)}
              placeholder={placeholder}
            />
          )}
        />
      ) : (
        <Box
          onClick={() => setIsEditing(true)}
          sx={{
            padding: "5px",
            cursor: "text",
            borderRadius: "4px",
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: "rgba(255,255,255,0.23)",
            "&:hover": {
              borderColor: "rgba(255,255,255,0.5)",
              color: "text.secondary",
            },
          }}
        >
          <Typography
            sx={{
              padding: "2.5px 4px 2.5px 6px;",
              lineHeight: "1.4375em",
            }}
            color="text.disabled"
          >
            {placeholder}
          </Typography>
        </Box>
      )}
    </>
  );
}
